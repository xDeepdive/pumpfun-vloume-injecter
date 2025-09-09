import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { PumpHelper } from "./pumpfunHelper";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";



const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
const Pumphelper = new PumpHelper(connection);
const signer = Keypair.fromSecretKey(bs58.decode(""))

const buyToken = async() =>{


    const buy = 




}