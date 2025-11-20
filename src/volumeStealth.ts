/**
 * Stealth Volume Injector - 17 Advanced Features
 * Complete anti-detection system for organic volume generation
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { PumpHelper } from "./pumpfunHelper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { RPCS_ENDPOINTS } from "../config";
import { logger, TransactionLog } from "./logger";
import { GasOptimizer, GasOptimizationConfig } from "./gasOptimizer";
import fs from "fs";
import path from "path";

// Import all stealth modules
import { createAntiDetectionEngine, TradePattern } from "./antiDetection";
import { createOrganicBehaviorEngine, WalletTier } from "./organicBehavior";
import { createAdvancedFeatures } from "./advancedFeatures";
import { createIntelligenceLayer, AgentPersonality, AIAgentPersonality } from "./intelligenceLayer";

export interface StealthVolumeConfig {
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
    gasOptimization?: GasOptimizationConfig;

    // Stealth features
    stealthMode?: boolean;
    walletAging?: boolean;
    multiHopFunding?: boolean;
    useJito?: boolean;
    mayhemMode?: boolean;
    mayhemTarget?: number;
    aiPersonalities?: boolean;
    cleanVolumeOnly?: boolean;
}

export class StealthVolumeInjector {
    private connection: Connection;
    private pumphelper: PumpHelper;
    private wallets: Keypair[] = [];
    private config: StealthVolumeConfig;
    private mainWallet?: Keypair;
    private gasOptimizer?: GasOptimizer;

    // Stealth engines
    private antiDetection: ReturnType<typeof createAntiDetectionEngine>;
    private organicBehavior: ReturnType<typeof createOrganicBehaviorEngine>;
    private advancedFeatures: ReturnType<typeof createAdvancedFeatures>;
    private intelligence: ReturnType<typeof createIntelligenceLayer>;

    // AI Agent personalities per wallet
    private walletPersonalities: Map<string, AIAgentPersonality> = new Map();
    private walletHoldTimers: Map<string, { bought: boolean; buyTime: number }> = new Map();

    // Statistics
    private executionCount = 0;
    private successCount = 0;
    private errorCount = 0;
    private totalVolume = 0;
    private totalFees = 0;
    private totalGasFees = 0;
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

    constructor(config: StealthVolumeConfig) {
        this.config = config;
        this.currentSlippage = config.slippage;
        this.connection = this.getConnection();
        this.pumphelper = new PumpHelper(this.connection);

        // Initialize stealth engines
        this.antiDetection = createAntiDetectionEngine(this.connection);
        this.organicBehavior = createOrganicBehaviorEngine();
        this.advancedFeatures = createAdvancedFeatures(this.connection);
        this.intelligence = createIntelligenceLayer(RPCS_ENDPOINTS);

        this.loadWallets();

        if (config.autoRefund) {
            this.loadMainWallet();
        }

        if (config.gasOptimization) {
            this.gasOptimizer = new GasOptimizer(this.connection);
        }

        // Initialize AI personalities for wallets if enabled
        if (config.aiPersonalities) {
            this.initializeWalletPersonalities();
        }

        // Activate mayhem mode if enabled
        if (config.mayhemMode && config.mayhemTarget) {
            this.intelligence.mayhem.activate(config.mayhemTarget);
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

        if (this.gasOptimizer) {
            this.gasOptimizer = new GasOptimizer(this.connection);
        }
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

            // Register wallet for aging system
            if (this.config.walletAging) {
                this.advancedFeatures.aging.registerWallet(wallet.publicKey.toBase58());
            }
        });

        console.log(`\n📊 Loaded ${this.wallets.length} wallets`);
    }

    private loadMainWallet() {
        const mainWalletPath = path.join(process.cwd(), '.pumpfun-config', 'main-wallet.json');
        if (fs.existsSync(mainWalletPath)) {
            const mainWalletKey = JSON.parse(fs.readFileSync(mainWalletPath, 'utf-8'));
            this.mainWallet = Keypair.fromSecretKey(new Uint8Array(mainWalletKey));
        }
    }

    private initializeWalletPersonalities() {
        console.log(`\n🤖 Initializing AI Agent Personalities...`);

        this.wallets.forEach(wallet => {
            const personality = new AIAgentPersonality();
            this.walletPersonalities.set(wallet.publicKey.toBase58(), personality);
        });

        console.log(`✅ ${this.wallets.length} AI agents spawned\n`);
    }

    private selectWallet(): Keypair | null {
        // Human behavior: check if trading session is active
        if (this.config.stealthMode) {
            const shouldTrade = this.organicBehavior.human.shouldTrade();
            if (!shouldTrade.trade) {
                if (Math.random() < 0.1) { // Only log 10% of time
                    console.log(`😴 ${shouldTrade.reason}`);
                }
                return null;
            }
        }

        // Wallet rotation with timezone awareness
        const sortedWallets = this.wallets
            .map(wallet => {
                const address = wallet.publicKey.toBase58();
                const usage = this.walletUsageCount.get(address) || 0;

                // Apply timezone activity multiplier if enabled
                let activityMultiplier = 1.0;
                if (this.config.stealthMode) {
                    activityMultiplier = this.intelligence.network.getTimezoneActivityMultiplier(address);
                }

                // Lower adjusted usage = higher priority
                const adjustedUsage = usage / activityMultiplier;

                return { wallet, usage, adjustedUsage };
            })
            .sort((a, b) => a.adjustedUsage - b.adjustedUsage);

        // Select from top 30% least-used wallets randomly
        const poolSize = Math.ceil(sortedWallets.length * 0.3);
        const pool = sortedWallets.slice(0, Math.max(1, poolSize));

        // Filter by AI personality if enabled
        let selectedWallet: Keypair | null = null;

        if (this.config.aiPersonalities) {
            // Try up to 5 wallets to find one whose personality wants to trade
            for (let i = 0; i < Math.min(5, pool.length); i++) {
                const candidate = pool[Math.floor(Math.random() * pool.length)].wallet;
                const personality = this.walletPersonalities.get(candidate.publicKey.toBase58());

                if (personality && personality.shouldTrade(0)) {
                    selectedWallet = candidate;
                    break;
                }
            }

            if (!selectedWallet) {
                // No personality wants to trade, skip this round
                return null;
            }
        } else {
            selectedWallet = pool[Math.floor(Math.random() * pool.length)].wallet;
        }

        // Increment usage
        const currentUsage = this.walletUsageCount.get(selectedWallet.publicKey.toBase58()) || 0;
        this.walletUsageCount.set(selectedWallet.publicKey.toBase58(), currentUsage + 1);

        return selectedWallet;
    }

    private async autoRefundWallet(wallet: Keypair, currentBalance: number) {
        if (!this.mainWallet || !this.config.autoRefund) return;

        const threshold = this.config.refundThreshold || 0.008;
        if (currentBalance >= threshold * LAMPORTS_PER_SOL) return;

        const refundAmount = 0.015 * LAMPORTS_PER_SOL;

        console.log(`💸 Auto-refunding wallet ${wallet.publicKey.toBase58().slice(0, 8)}... with ${refundAmount / LAMPORTS_PER_SOL} SOL`);

        try {
            // Use multi-hop funding if enabled
            if (this.config.multiHopFunding && this.config.stealthMode) {
                await this.antiDetection.funding.fundWalletWithHops(
                    this.mainWallet,
                    wallet.publicKey,
                    refundAmount / LAMPORTS_PER_SOL,
                    2
                );
                console.log(`✅ Auto-refund successful (multi-hop)`);
            } else {
                // Direct refund
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
            }
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

        // Check mayhem mode completion
        if (this.config.mayhemMode && !this.intelligence.mayhem.isActive()) {
            console.log(`\n🔥 Mayhem mode completed!`);
            return true;
        }

        return false;
    }

    private getNextInterval(): number {
        let interval = this.config.interval;

        // Mayhem mode adjusts interval
        if (this.config.mayhemMode && this.intelligence.mayhem.isActive()) {
            interval = this.intelligence.mayhem.getInterval(interval);
        }

        // Apply timing entropy if stealth mode enabled
        if (this.config.stealthMode) {
            interval = this.antiDetection.timing.getNextInterval(interval);
        }

        // Apply jitter for signature obfuscation
        interval = this.intelligence.signature.getTimingJitter(interval);

        return interval;
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
            // Feature 15: Failure simulation (7% intentional failures)
            if (this.config.stealthMode) {
                const shouldFail = this.organicBehavior.failure.shouldSimulateFailure();
                if (shouldFail.fail) {
                    console.log(`[${this.executionCount}] 🎭 Simulated failure: ${shouldFail.reason}`);
                    this.errorCount++;
                    this.isRunning = false;
                    return;
                }
            }

            const signer = this.selectWallet();

            // If no wallet selected (human behavior or AI personality says no), skip
            if (!signer) {
                this.isRunning = false;
                return;
            }

            logEntry.wallet = signer.publicKey.toBase58();

            const wallet_balance = await this.connection.getBalance(signer.publicKey);

            // Auto-refund if enabled
            if (this.config.autoRefund && wallet_balance < (this.config.refundThreshold || 0.008) * LAMPORTS_PER_SOL) {
                await this.autoRefundWallet(signer, wallet_balance);
                this.isRunning = false;
                return;
            }

            if (wallet_balance < 0.01 * LAMPORTS_PER_SOL) {
                console.log(`[${this.executionCount}] Insufficient balance (${(wallet_balance / LAMPORTS_PER_SOL).toFixed(6)} SOL), skipping...`);
                this.isRunning = false;
                return;
            }

            // Feature 4: Organic transaction sizing
            let randomPercent: number;
            if (this.config.stealthMode) {
                randomPercent = this.antiDetection.sizer.getTradeSize(this.config.minPercent, this.config.maxPercent);

                // Feature 1: Apply emotional multiplier
                const emotionalMultiplier = this.organicBehavior.human.getEmotionalSizeMultiplier();
                randomPercent *= emotionalMultiplier;

                // Feature 10: Apply AI personality sizing
                if (this.config.aiPersonalities) {
                    const personality = this.walletPersonalities.get(signer.publicKey.toBase58());
                    if (personality) {
                        randomPercent = personality.getTradeSize(this.config.minPercent, this.config.maxPercent);
                    }
                }

                // Clamp to min/max
                randomPercent = Math.max(this.config.minPercent, Math.min(this.config.maxPercent, randomPercent));
            } else {
                randomPercent = Math.random() * (this.config.maxPercent - this.config.minPercent) + this.config.minPercent;
            }

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

                // Get priority fee instructions
                let priorityFeeInstructions: any[] = [];
                let estimatedGasFee = 0;

                if (this.gasOptimizer && this.config.gasOptimization) {
                    priorityFeeInstructions = await this.gasOptimizer.getPriorityFeeInstructions(
                        this.config.gasOptimization
                    );

                    const feeEstimate = await this.gasOptimizer.estimateFee(this.config.gasOptimization);
                    estimatedGasFee = feeEstimate.estimatedFee / LAMPORTS_PER_SOL;
                }

                // Feature 7: Add signature obfuscation (compute budget variance)
                if (this.config.stealthMode) {
                    const obfuscationInstructions = this.intelligence.signature.addComputeBudgetVariance();
                    priorityFeeInstructions = obfuscationInstructions;
                }

                const message = new TransactionMessage({
                    payerKey: signer.publicKey,
                    instructions: [...priorityFeeInstructions, ...tx1.data, ...tx2.data],
                    recentBlockhash: blockhash
                }).compileToV0Message();

                const vTx = new VersionedTransaction(message);
                vTx.sign([signer]);

                const simulatedTx = await this.connection.simulateTransaction(vTx);
                console.log(`[${this.executionCount}] Simulation result:`, simulatedTx.value.err ? "FAILED" : "SUCCESS");

                if (this.gasOptimizer && this.config.gasOptimization) {
                    console.log(`[${this.executionCount}] Priority level: ${this.config.gasOptimization.priorityLevel}, Est. gas fee: ${estimatedGasFee.toFixed(6)} SOL`);
                }

                if (!simulatedTx.value.err) {
                    // Feature 6: Use Jito bundle if enabled
                    let signature: string;

                    if (this.config.useJito && this.advancedFeatures.jito.shouldUseJito()) {
                        try {
                            signature = await this.advancedFeatures.jito.sendBundle([vTx as any], 10000);
                        } catch (error) {
                            // Fallback to regular send
                            signature = await this.connection.sendTransaction(vTx, {
                                maxRetries: this.config.maxRetries || 3,
                                skipPreflight: true
                            });
                        }
                    } else {
                        signature = await this.connection.sendTransaction(vTx, {
                            maxRetries: this.config.maxRetries || 3,
                            skipPreflight: true
                        });
                    }

                    console.log(`[${this.executionCount}] Transaction sent: ${signature}`);

                    logEntry.signature = signature;
                    logEntry.success = true;
                    logEntry.fee = solAmount * 0.02 + estimatedGasFee;
                    this.successCount++;
                    this.totalVolume += solAmount * 2; // Buy + sell
                    this.totalFees += solAmount * 0.02;
                    this.totalGasFees += estimatedGasFee;

                    // Feature 8: Record clean volume
                    if (this.config.cleanVolumeOnly) {
                        this.advancedFeatures.cleanVolume.recordTrade(
                            signer.publicKey.toBase58(),
                            'buy',
                            solAmount
                        );
                    }

                    // Feature 9: Record mayhem mode volume
                    if (this.config.mayhemMode) {
                        this.intelligence.mayhem.recordVolume(solAmount * 2);
                    }
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

            // Check pattern change
            if (this.config.stealthMode) {
                this.antiDetection.patternEngine.maybeChangePattern();
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
        console.log(`Total Protocol Fees: ${this.totalFees.toFixed(4)} SOL`);

        if (this.gasOptimizer && this.totalGasFees > 0) {
            console.log(`Total Gas Fees: ${this.totalGasFees.toFixed(6)} SOL`);
            console.log(`Total Fees (Protocol + Gas): ${(this.totalFees + this.totalGasFees).toFixed(6)} SOL`);
            console.log(`Avg Fee/Tx: ${((this.totalFees + this.totalGasFees) / Math.max(1, this.successCount)).toFixed(6)} SOL`);
        } else {
            console.log(`Avg Fee/Tx: ${(this.totalFees / Math.max(1, this.successCount)).toFixed(6)} SOL`);
        }

        if (this.config.targetVolume) {
            console.log(`Progress to target: ${((this.totalVolume / this.config.targetVolume) * 100).toFixed(1)}%`);
        }

        if (this.config.maxBudget) {
            const totalCost = this.totalFees + this.totalGasFees;
            console.log(`Budget used: ${((totalCost / this.config.maxBudget) * 100).toFixed(1)}%`);
        }

        // Stealth mode stats
        if (this.config.stealthMode) {
            console.log(`\n🕵️ Stealth Mode Stats:`);
            console.log(`   Human state: ${this.organicBehavior.human.getState().emotion}`);
            console.log(`   Timing mode: ${this.antiDetection.timing.getCurrentMode()}`);
            console.log(`   Failure rate: ${this.organicBehavior.failure.getStats().failureRate}`);

            if (this.config.cleanVolumeOnly) {
                console.log(`   Clean volume: ${this.advancedFeatures.cleanVolume.getStats().cleanVolume} SOL`);
            }
        }

        // Mayhem mode stats
        if (this.config.mayhemMode) {
            const progress = this.intelligence.mayhem.getProgress();
            console.log(`\n🔥 Mayhem Mode Progress:`);
            console.log(`   Volume: ${progress.volume.toFixed(2)} / ${progress.target} SOL (${progress.progress.toFixed(1)}%)`);
            console.log(`   Time left: ${progress.timeLeft}`);
        }

        console.log();
    }

    async start() {
        console.log(`\n🚀 Starting ${this.config.dryRun ? 'DRY RUN ' : ''}Stealth Volume Injection...`);

        if (this.config.dryRun) {
            console.log('🧪 DRY RUN MODE - No real transactions will be sent\n');
        }

        if (this.config.stealthMode) {
            console.log('🕵️  STEALTH MODE: All 17 anti-detection features ACTIVE\n');
        }

        if (this.gasOptimizer && this.config.gasOptimization) {
            console.log(`⚡ Gas Optimization: Enabled (Priority: ${this.config.gasOptimization.priorityLevel})\n`);
        }

        if (this.config.mayhemMode) {
            console.log(`🔥 MAYHEM MODE: Target ${this.config.mayhemTarget} SOL in 24h\n`);
        }

        let lastInterval = this.config.interval;

        const executeNextTrade = async () => {
            if (this.shouldStop) {
                console.log('\n🛑 Stopping bot...');
                this.printStats();
                process.exit(0);
            }

            await this.injectVolume();

            // Get next interval (dynamic)
            lastInterval = this.getNextInterval();
            setTimeout(executeNextTrade, lastInterval);
        };

        // Start first trade
        setTimeout(executeNextTrade, lastInterval);

        process.on('SIGINT', () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            this.shouldStop = true;
            setTimeout(() => {
                this.printStats();
                process.exit(0);
            }, 1000);
        });

        process.on('SIGTERM', () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            this.shouldStop = true;
            setTimeout(() => {
                this.printStats();
                process.exit(0);
            }, 1000);
        });
    }
}
