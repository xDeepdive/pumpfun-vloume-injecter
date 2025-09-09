import { PublicKey, PublicKeyInitData } from "@solana/web3.js";
import { PUMP_PROGRAM_ID } from "./pumpfunHelper";

export const globalPda = (programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        programId,
    )[0];
}


export function bondingCurvePda(mint: PublicKeyInitData): PublicKey {
  const [bondingCurvePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), new PublicKey(mint).toBuffer()],
    PUMP_PROGRAM_ID,
  );
  return bondingCurvePda;
}



export function pumpFeeConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("fee_config"), PUMP_PROGRAM_ID.toBuffer()],
    PUMP_PROGRAM_ID,
  )[0];
}


export function creatorVaultPda(creator: PublicKey) {
  const [creatorVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_PROGRAM_ID,
  );
  return creatorVault;
}



