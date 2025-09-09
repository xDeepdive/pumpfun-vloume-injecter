import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { PumpHelper } from "./pumpfunHelper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { getSolFromToken } from "./calculations";



const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
const pumphelper = new PumpHelper(connection);
const signer = Keypair.fromSecretKey(bs58.decode(PRIVAT_KEY))
const mint = new PublicKey("6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump")
const solAmount = 0.01;

const buyToken = async() =>{

  const bonding_curve_data = await pumphelper.fetchBondingCurve(mint);
  const tokenAmount = pumphelper.getTokenAmount(bonding_curve_data, solAmount);

  console.log("💰 Token amount to receive:", Number(tokenAmount.toString())/1000000);

  const global = await pumphelper.fetchGlobal();

  const tx1 = await pumphelper.getBuyTxs(
    global,
    mint,
    signer.publicKey,
    100, 
    new BN(tokenAmount),
    new BN(solAmount * LAMPORTS_PER_SOL)
  );

  if (tx1.success) {
    const transection = new Transaction().add(...tx1.data);
    const latestBlockhash = await connection.getLatestBlockhash();
    transection.recentBlockhash = latestBlockhash.blockhash;
    transection.feePayer = signer.publicKey;
    transection.sign(signer);
    const simulatedTx = await connection.simulateTransaction(transection);
    console.log("Simulation Result:", simulatedTx);

    // const txs = await connection.sendRawTransaction(transection.serialize());

    // console.log("here is sign---",txs);
  }

}

const sellToken = async() => {
    const global = await pumphelper.fetchGlobal();
    const tokenAmount = 700000;


  const bondingCurve = await pumphelper.fetchBondingCurve(mint);
  const solAmount = getSolFromToken(
    global,
    bondingCurve,
    new BN(tokenAmount * 1000000)
  );

  console.log("💎 SOL amount to receive:", Number(solAmount) / LAMPORTS_PER_SOL);

  const tx2 = await pumphelper.getSellTxs(
    mint,
    signer.publicKey,
    10, // Slippage tolerance (10 = 0.1%)
    new BN(tokenAmount * 1000000),
    solAmount
  );

  if (tx2.success) {
    const transection = new Transaction().add(...tx2.data);
    const latestBlockhash = await connection.getLatestBlockhash();
    transection.recentBlockhash = latestBlockhash.blockhash;
    transection.feePayer = signer.publicKey;
    transection.sign(signer);

    const simulatedTx = await connection.simulateTransaction(transection);
    console.log("Simulation Result:", simulatedTx);

      const txs = await connection.sendRawTransaction(transection.serialize());

    console.log("here is sign---",txs);
  }
}

// buyToken();

sellToken();