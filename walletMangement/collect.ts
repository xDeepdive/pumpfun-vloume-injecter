import {  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import wallets from "./key.json"
import bs58 from "bs58";




export const TransferInOne = async (connection:Connection,destination: Keypair) => {

    const devwallets: Keypair[] = wallets.map((val) => Keypair.fromSecretKey(bs58.decode(val)));
    const allwallet = devwallets.slice(9,10);
    console.log(allwallet.length);
    const sendSolTx: TransactionInstruction[] = [];
    

    console.log("here is the all balances!!!");


    for (let i = 0; i < allwallet.length; i++) {
        const balance = await connection.getBalance(allwallet[i].publicKey);

        console.log("here is balancee----- "+i, balance/LAMPORTS_PER_SOL)
        if (balance > 5000) {
            sendSolTx.push(
                SystemProgram.transfer({
                    fromPubkey: allwallet[i].publicKey, 
                    toPubkey:  destination.publicKey,
                    lamports: balance
                })
            );
        }
    }


     console.log("here is length--",sendSolTx.length)

    const tx = new Transaction().add(...sendSolTx);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = destination.publicKey;

    const signature = await sendAndConfirmTransaction(connection, tx, [...allwallet,destination]);
    return signature;
}