import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { PumpHelper } from "./pumpfunHelper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { distributeSol } from "../walletsHelpers/distributeSol";
import { RPCS_ENDPOINTS } from "../config";
import wallets from "../keys/data.json";

const connection = new Connection(RPCS_ENDPOINTS[0], "confirmed");
const pumphelper = new PumpHelper(connection);
const mint = new PublicKey("6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump");

let executionCount = 0;
let successCount = 0;
let errorCount = 0;
let isRunning = false; 

const InjectVolume = async () => {
  if (isRunning) {
    console.log("Previous execution still running, skipping...");
    return;
  }

  isRunning = true;
  executionCount++;
  const startTime = Date.now();

  try {
    const RANDOM_RPC = RPCS_ENDPOINTS[Math.floor(Math.random() * RPCS_ENDPOINTS.length)];
    const connection = new Connection(RANDOM_RPC, "confirmed");

    const signer = Keypair.fromSecretKey(bs58.decode(wallets[Math.floor(Math.random() * wallets.length)]));

    const wallet_balance = await connection.getBalance(signer.publicKey);
    
    if (wallet_balance < 0.01 * LAMPORTS_PER_SOL) {
      console.log(`[${executionCount}] Insufficient balance (${wallet_balance / LAMPORTS_PER_SOL} SOL), skipping...`);
      return;
    }

    const randomPercent = Math.random() * (90 - 20) + 20; // 20 to 90
    const solAmount = (wallet_balance / LAMPORTS_PER_SOL) * (randomPercent / 100);
    console.log(`[${executionCount}] Using ${randomPercent.toFixed(2)}% of wallet balance: ${solAmount.toFixed(4)} SOL`);

    const bonding_curve_data = await pumphelper.fetchBondingCurve(mint);
    const tokenAmount = pumphelper.getTokenAmount(bonding_curve_data, Number(solAmount.toFixed(4)));
    const global = await pumphelper.fetchGlobal();

    const tx1 = await pumphelper.getBuyTxs(
      global,
      mint,
      signer.publicKey,
      100,
      new BN(tokenAmount),
      new BN(solAmount * LAMPORTS_PER_SOL)
    );

    const tx2 = await pumphelper.getSellTxs(
      mint,
      signer.publicKey,
      100,
      new BN(tokenAmount),
      new BN(solAmount)
    );

    const { blockhash } = await connection.getLatestBlockhash();

    if (tx1.success && tx2.success) {
      const message = new TransactionMessage({
        payerKey: signer.publicKey,
        instructions: [...tx1.data, ...tx2.data],
        recentBlockhash: blockhash
      }).compileToV0Message();

      const vTx = new VersionedTransaction(message);
      vTx.sign([signer]);
      
      const simulatedTx = await connection.simulateTransaction(vTx);
      console.log(`[${executionCount}] Simulation result:`, simulatedTx.value.err ? "FAILED" : "SUCCESS");

      if (!simulatedTx.value.err) {
        const signature = await connection.sendTransaction(vTx, {
          maxRetries: 3,
          skipPreflight: true
        });
        console.log(`[${executionCount}] Transaction sent: ${signature}`);
        successCount++;
      } else {
        console.error(`[${executionCount}] Simulation failed:`, simulatedTx.value.err);
        errorCount++;
      }
    } else {
      console.error(`[${executionCount}] Failed to create transactions`);
      errorCount++;
    }

  } catch (error) {
    console.error(`[${executionCount}] Error in InjectVolume:`, error);
    errorCount++;
  } finally {
    const executionTime = Date.now() - startTime;
    console.log(`[${executionCount}] Execution completed in ${executionTime}ms`);
    
    // Log stats every 10 executions
    if (executionCount % 10 === 0) {
      const successRate = ((successCount / executionCount) * 100).toFixed(2);
      console.log(`\n--- Stats after ${executionCount} executions ---`);
      console.log(`Success: ${successCount}, Errors: ${errorCount}, Success rate: ${successRate}%\n`);
    }
    
    isRunning = false;
  }
};

console.log("Starting volume injection every 1 second...");
const intervalId = setInterval(() => {
  InjectVolume();
}, 500);

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  clearInterval(intervalId);
  console.log(`Final stats: ${successCount}/${executionCount} successful executions`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  clearInterval(intervalId);
  console.log(`Final stats: ${successCount}/${executionCount} successful executions`);
  process.exit(0);
});
