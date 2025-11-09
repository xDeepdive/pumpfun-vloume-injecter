import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import bs58 from "bs58";

// Load configuration
const CONFIG_DIR = path.join(process.cwd(), '.pumpfun-config');
const MAIN_WALLET_FILE = path.join(CONFIG_DIR, 'main-wallet.json');
const TRADING_WALLETS_FILE = path.join(process.cwd(), 'keys', 'data.json');

async function collectAllFunds() {
    console.log('🔄 Starting fund collection...\n');

    // Check if files exist
    if (!fs.existsSync(MAIN_WALLET_FILE)) {
        console.error('❌ Main wallet not found. Run "npm run bot setup" first.');
        process.exit(1);
    }

    if (!fs.existsSync(TRADING_WALLETS_FILE)) {
        console.error('❌ No trading wallets found. Run "npm run bot distribute" first.');
        process.exit(1);
    }

    // Load main wallet
    const mainWalletKey = JSON.parse(fs.readFileSync(MAIN_WALLET_FILE, 'utf-8'));
    const mainWallet = Keypair.fromSecretKey(new Uint8Array(mainWalletKey));

    console.log(`📍 Main wallet: ${mainWallet.publicKey.toBase58()}\n`);

    // Load trading wallets
    const tradingWalletsData = JSON.parse(fs.readFileSync(TRADING_WALLETS_FILE, 'utf-8'));
    const tradingWallets = tradingWalletsData.map((key: string) =>
        Keypair.fromSecretKey(bs58.decode(key))
    );

    console.log(`👛 Found ${tradingWallets.length} trading wallets\n`);

    // Load config for RPC
    const configFile = path.join(CONFIG_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    const connection = new Connection(config.rpcs[0], 'confirmed');

    let totalCollected = 0;
    let successCount = 0;
    let skipCount = 0;

    // Collect from each wallet
    for (let i = 0; i < tradingWallets.length; i++) {
        const wallet = tradingWallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;

        console.log(`Wallet ${i}: ${wallet.publicKey.toBase58().slice(0, 8)}... - ${balanceSOL.toFixed(6)} SOL`);

        // Skip if balance is too low (need to keep some for fees)
        if (balance < 0.001 * LAMPORTS_PER_SOL) {
            console.log(`  ⏭️  Skipped (balance too low)\n`);
            skipCount++;
            continue;
        }

        try {
            // Leave 0.001 SOL for transaction fee
            const amountToSend = balance - (0.001 * LAMPORTS_PER_SOL);

            if (amountToSend <= 0) {
                console.log(`  ⏭️  Skipped (not enough for fees)\n`);
                skipCount++;
                continue;
            }

            // Create transfer transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: mainWallet.publicKey,
                    lamports: Math.floor(amountToSend),
                })
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [wallet],
                {
                    commitment: 'confirmed',
                    maxRetries: 3,
                }
            );

            const collectedSOL = amountToSend / LAMPORTS_PER_SOL;
            totalCollected += collectedSOL;
            successCount++;

            console.log(`  ✅ Collected ${collectedSOL.toFixed(6)} SOL`);
            console.log(`  📝 Tx: ${signature}\n`);

        } catch (error) {
            console.log(`  ❌ Failed to collect: ${error}\n`);
        }
    }

    console.log('─'.repeat(60));
    console.log('\n✅ Collection Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total wallets: ${tradingWallets.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log(`   Failed: ${tradingWallets.length - successCount - skipCount}`);
    console.log(`   Total collected: ${totalCollected.toFixed(6)} SOL`);
    console.log(`\n💰 Funds sent to: ${mainWallet.publicKey.toBase58()}\n`);
}

collectAllFunds().catch(console.error);
