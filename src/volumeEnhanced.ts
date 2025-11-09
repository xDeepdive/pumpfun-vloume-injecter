import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { PumpHelper } from "./pumpfunHelper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { RPCS_ENDPOINTS } from "../config";
import { logger, TransactionLog } from "./logger";
import fs from "fs";
import path from "path";

export interface VolumeConfig {
    tokenMint: string;
    interval: number;
    slippage: number;
    minPercent: number;
    maxPercent: number;
    dryRun?: boolean;
    autoRefund?: boolean;
    refundThreshold?: number;
    targetVolume?: number;
    maxBudget?: number;
    smartSlippage?: boolean;
    targetSuccessRate?: number;
    maxRetries?: number;
}

export class EnhancedVolumeInjector {
    private connection: Connection;
    private pumphelper: PumpHelper;
    private wallets: Keypair[] = [];
    private config: VolumeConfig;
    private mainWallet?: Keypair;

    // Statistics
    private executionCount = 0;
    private successCount = 0;
    private errorCount = 0;
    private totalVolume = 0;
    private totalFees = 0;
    private isRunning = false;
    private shouldStop = false;

    // RPC failover
    private currentRPCIndex = 0;
    private rpcFailureCount: Map<number, number> = new Map();

    // Smart slippage
    private currentSlippage: number;
    private slippageAdjustmentInterval = 10;

    // Wallet rotation
    private walletUsageCount: Map<string, number> = new Map();

    constructor(config: VolumeConfig) {
        this.config = config;
        this.currentSlippage = config.slippage;
        this.connection = this.getConnection();
        this.pumphelper = new PumpHelper(this.connection);
        this.loadWallets();
        if (config.autoRefund) {
            this.loadMainWallet();
        }
    }

    private getConnection(): Connection {
        const rpc = RPCS_ENDPOINTS[this.currentRPCIndex];
        return new Connection(rpc, "confirmed");
    }

    private async switchRPC() {
        const oldIndex = this.currentRPCIndex;
        this.currentRPCIndex = (this.currentRPCIndex + 1) % RPCS_ENDPOINTS.length;

        const failures = this.rpcFailureCount.get(oldIndex) || 0;
        this.rpcFailureCount.set(oldIndex, failures + 1);

        console.log(`⚠️ Switching RPC from endpoint ${oldIndex} to ${this.currentRPCIndex}`);
        this.connection = this.getConnection();
        this.pumphelper = new PumpHelper(this.connection);
    }

    private loadWallets() {
        const keysPath = path.join(process.cwd(), 'keys', 'data.json');
        if (!fs.existsSync(keysPath)) {
            throw new Error('No wallets found. Run "npm run bot distribute" first.');
        }

        const walletKeys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
        this.wallets = walletKeys.map((key: string) =>
            Keypair.fromSecretKey(bs58.decode(key))
        );

        // Initialize wallet usage count
        this.wallets.forEach(wallet => {
            this.walletUsageCount.set(wallet.publicKey.toBase58(), 0);
        });
    }

    private loadMainWallet() {
        const mainWalletPath = path.join(process.cwd(), '.pumpfun-config', 'main-wallet.json');
        if (fs.existsSync(mainWalletPath)) {
            const mainWalletKey = JSON.parse(fs.readFileSync(mainWalletPath, 'utf-8'));
            this.mainWallet = Keypair.fromSecretKey(new Uint8Array(mainWalletKey));
        }
    }

    private selectWallet(): Keypair {
        // Wallet rotation: prefer wallets with lower usage count
        const sortedWallets = this.wallets
            .map(wallet => ({
                wallet,
                usage: this.walletUsageCount.get(wallet.publicKey.toBase58()) || 0
            }))
            .sort((a, b) => a.usage - b.usage);

        // Select from top 30% least-used wallets randomly
        const poolSize = Math.ceil(sortedWallets.length * 0.3);
        const pool = sortedWallets.slice(0, Math.max(1, poolSize));
        const selected = pool[Math.floor(Math.random() * pool.length)].wallet;

        // Increment usage
        const currentUsage = this.walletUsageCount.get(selected.publicKey.toBase58()) || 0;
        this.walletUsageCount.set(selected.publicKey.toBase58(), currentUsage + 1);

        return selected;
    }

    private async autoRefundWallet(wallet: Keypair, currentBalance: number) {
        if (!this.mainWallet || !this.config.autoRefund) return;

        const threshold = this.config.refundThreshold || 0.008;
        if (currentBalance >= threshold * LAMPORTS_PER_SOL) return;

        const refundAmount = 0.015 * LAMPORTS_PER_SOL;

        console.log(`💸 Auto-refunding wallet ${wallet.publicKey.toBase58().slice(0, 8)}... with ${refundAmount / LAMPORTS_PER_SOL} SOL`);

        try {
            const { Transaction, SystemProgram } = await import("@solana/web3.js");
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.mainWallet.publicKey,
                    toPubkey: wallet.publicKey,
                    lamports: Math.floor(refundAmount),
                })
            );

            const { sendAndConfirmTransaction } = await import("@solana/web3.js");
            await sendAndConfirmTransaction(this.connection, transaction, [this.mainWallet]);
            console.log(`✅ Auto-refund successful`);
        } catch (error) {
            console.error(`❌ Auto-refund failed:`, error);
        }
    }

    private adjustSlippage() {
        if (!this.config.smartSlippage || this.executionCount < this.slippageAdjustmentInterval) {
            return;
        }

        const targetRate = this.config.targetSuccessRate || 75;
        const currentRate = (this.successCount / this.executionCount) * 100;

        if (currentRate < targetRate - 10) {
            // Success rate too low, increase slippage
            this.currentSlippage = Math.min(100, this.currentSlippage + 5);
            console.log(`📈 Increasing slippage to ${this.currentSlippage}% (success rate: ${currentRate.toFixed(1)}%)`);
        } else if (currentRate > targetRate + 10) {
            // Success rate too high, decrease slippage
            this.currentSlippage = Math.max(5, this.currentSlippage - 2);
            console.log(`📉 Decreasing slippage to ${this.currentSlippage}% (success rate: ${currentRate.toFixed(1)}%)`);
        }
    }

    private checkTargets(): boolean {
        if (this.config.targetVolume && this.totalVolume >= this.config.targetVolume) {
            console.log(`\n🎯 Target volume reached: ${this.totalVolume.toFixed(4)} SOL`);
            return true;
        }

        if (this.config.maxBudget && this.totalFees >= this.config.maxBudget) {
            console.log(`\n💰 Max budget reached: ${this.totalFees.toFixed(4)} SOL spent in fees`);
            return true;
        }

        return false;
    }

    async injectVolume() {
        if (this.isRunning) {
            console.log("Previous execution still running, skipping...");
            return;
        }

        this.isRunning = true;
        this.executionCount++;
        const startTime = Date.now();

        const logEntry: Partial<TransactionLog> = {
            timestamp: startTime,
            date: new Date().toISOString(),
            tokenMint: this.config.tokenMint,
            type: 'combined',
            slippage: this.currentSlippage,
        };

        try {
            const signer = this.selectWallet();
            logEntry.wallet = signer.publicKey.toBase58();

            const wallet_balance = await this.connection.getBalance(signer.publicKey);

            // Auto-refund if enabled
            if (this.config.autoRefund && wallet_balance < (this.config.refundThreshold || 0.008) * LAMPORTS_PER_SOL) {
                await this.autoRefundWallet(signer, wallet_balance);
                this.isRunning = false;
                return;
            }

            if (wallet_balance < 0.01 * LAMPORTS_PER_SOL) {
                console.log(`[${this.executionCount}] Insufficient balance (${wallet_balance / LAMPORTS_PER_SOL} SOL), skipping...`);
                this.isRunning = false;
                return;
            }

            const randomPercent = Math.random() * (this.config.maxPercent - this.config.minPercent) + this.config.minPercent;
            const solAmount = (wallet_balance / LAMPORTS_PER_SOL) * (randomPercent / 100);
            logEntry.amount = solAmount;

            if (this.config.dryRun) {
                console.log(`[${this.executionCount}] 🧪 DRY RUN: Would trade ${solAmount.toFixed(4)} SOL (${randomPercent.toFixed(2)}%)`);
                console.log(`[${this.executionCount}] 🧪 Estimated fee: ~${(solAmount * 0.02).toFixed(6)} SOL`);
                logEntry.success = true;
                logEntry.fee = solAmount * 0.02;
                logEntry.executionTime = Date.now() - startTime;
                logger.log(logEntry as TransactionLog);
                this.successCount++;
                this.isRunning = false;
                return;
            }

            console.log(`[${this.executionCount}] Using ${randomPercent.toFixed(2)}% of wallet balance: ${solAmount.toFixed(4)} SOL`);

            const mint = new PublicKey(this.config.tokenMint);
            const bonding_curve_data = await this.pumphelper.fetchBondingCurve(mint);
            const tokenAmount = this.pumphelper.getTokenAmount(bonding_curve_data, Number(solAmount.toFixed(4)));
            const global = await this.pumphelper.fetchGlobal();

            const tx1 = await this.pumphelper.getBuyTxs(
                global,
                mint,
                signer.publicKey,
                this.currentSlippage * 10,
                new BN(tokenAmount),
                new BN(solAmount * LAMPORTS_PER_SOL)
            );

            const tx2 = await this.pumphelper.getSellTxs(
                mint,
                signer.publicKey,
                this.currentSlippage * 10,
                new BN(tokenAmount),
                new BN(solAmount)
            );

            const { blockhash } = await this.connection.getLatestBlockhash();

            if (tx1.success && tx2.success) {
                const { TransactionMessage, VersionedTransaction } = await import("@solana/web3.js");
                const message = new TransactionMessage({
                    payerKey: signer.publicKey,
                    instructions: [...tx1.data, ...tx2.data],
                    recentBlockhash: blockhash
                }).compileToV0Message();

                const vTx = new VersionedTransaction(message);
                vTx.sign([signer]);

                const simulatedTx = await this.connection.simulateTransaction(vTx);
                console.log(`[${this.executionCount}] Simulation result:`, simulatedTx.value.err ? "FAILED" : "SUCCESS");

                if (!simulatedTx.value.err) {
                    const signature = await this.connection.sendTransaction(vTx, {
                        maxRetries: this.config.maxRetries || 3,
                        skipPreflight: true
                    });
                    console.log(`[${this.executionCount}] Transaction sent: ${signature}`);

                    logEntry.signature = signature;
                    logEntry.success = true;
                    logEntry.fee = solAmount * 0.02;
                    this.successCount++;
                    this.totalVolume += solAmount * 2; // Buy + sell
                    this.totalFees += solAmount * 0.02;
                } else {
                    console.error(`[${this.executionCount}] Simulation failed:`, simulatedTx.value.err);
                    logEntry.success = false;
                    logEntry.error = JSON.stringify(simulatedTx.value.err);
                    logEntry.fee = 0;
                    this.errorCount++;
                }
            } else {
                console.error(`[${this.executionCount}] Failed to create transactions`);
                logEntry.success = false;
                logEntry.error = "Failed to create transactions";
                logEntry.fee = 0;
                this.errorCount++;
            }

        } catch (error: any) {
            console.error(`[${this.executionCount}] Error in InjectVolume:`, error);

            // Check if RPC error
            if (error.message?.includes('fetch failed') || error.message?.includes('blockhash')) {
                await this.switchRPC();
            }

            logEntry.success = false;
            logEntry.error = error.message;
            logEntry.fee = 0;
            this.errorCount++;
        } finally {
            const executionTime = Date.now() - startTime;
            logEntry.executionTime = executionTime;
            logger.log(logEntry as TransactionLog);

            console.log(`[${this.executionCount}] Execution completed in ${executionTime}ms`);

            // Log stats every 10 executions
            if (this.executionCount % 10 === 0) {
                this.printStats();
                this.adjustSlippage();
            }

            // Check if targets reached
            if (this.checkTargets()) {
                this.shouldStop = true;
            }

            this.isRunning = false;
        }
    }

    printStats() {
        const successRate = ((this.successCount / this.executionCount) * 100).toFixed(2);
        console.log(`\n--- Stats after ${this.executionCount} executions ---`);
        console.log(`Success: ${this.successCount}, Errors: ${this.errorCount}, Success rate: ${successRate}%`);
        console.log(`Total Volume: ${this.totalVolume.toFixed(4)} SOL`);
        console.log(`Total Fees: ${this.totalFees.toFixed(4)} SOL`);
        console.log(`Avg Fee/Tx: ${(this.totalFees / Math.max(1, this.successCount)).toFixed(6)} SOL`);
        if (this.config.targetVolume) {
            console.log(`Progress to target: ${((this.totalVolume / this.config.targetVolume) * 100).toFixed(1)}%`);
        }
        if (this.config.maxBudget) {
            console.log(`Budget used: ${((this.totalFees / this.config.maxBudget) * 100).toFixed(1)}%`);
        }
        console.log();
    }

    async start() {
        console.log(`Starting ${this.config.dryRun ? 'DRY RUN ' : ''}volume injection...`);
        if (this.config.dryRun) {
            console.log('🧪 DRY RUN MODE - No real transactions will be sent\n');
        }

        const intervalId = setInterval(async () => {
            if (this.shouldStop) {
                clearInterval(intervalId);
                console.log('\n🛑 Stopping bot...');
                this.printStats();
                process.exit(0);
            }
            await this.injectVolume();
        }, this.config.interval);

        process.on('SIGINT', () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            clearInterval(intervalId);
            this.printStats();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            clearInterval(intervalId);
            this.printStats();
            process.exit(0);
        });
    }
}
