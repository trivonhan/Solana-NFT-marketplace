import { BorshCoder, Idl } from "@project-serum/anchor";
import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import NftMarketplaceIdl from "../target/idl/nft_marketplace.json";

const coder = new BorshCoder(NftMarketplaceIdl as Idl)

export interface Creator {
  address: PublicKey;
  verified: boolean;
  share: number;
}

export interface Collection {
  verified: boolean;
  key: PublicKey;
}

export enum UseMethod {
  Burn,
  Multiple,
  Single,
}

export interface Uses {
  useMethod: UseMethod,
  remaining: BN,
  total: BN,
}

export interface CreateMetadataAccountRequest {
  creators?: Creator[] | null;
  name: string;
  symbol: string;
  uri: string;
  collection?: Collection | null;
  size?: BN | null;
}

export interface CreateMasterEditionRequest {
  maxSupply: BN;
}

export interface DataV2 {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators?: Creator[] | null;
  collection?: Collection | null;
  uses?: Uses | null;
}

export interface UpdateMetadataAccountRequest {
  newUpdateAuthority?: PublicKey | null;
  data?: DataV2 | null;
  primarySaleHappened?: boolean | null;
  isMutable?: boolean | null;
}

export interface InitMarketplaceRequest {
  sellerFeeBasisPoints: number;
  bump: number;
  feeBump: number;
}

export interface ListNftToMarketplaceRequest {
  listPrice: BN;
  bump: number;
}

export class NftMarketplaceInstructionService {

  static createMetadataAccountInstruction(
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    updateAuthority: PublicKey,
    systemProgramId: PublicKey,
    sysvarRentProgramId: PublicKey,
    tokenMetadataProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    creators?: Creator[],
    collection?: Collection,
    size?: BN,
  ): TransactionInstruction {
    const request: CreateMetadataAccountRequest = {
      creators: creators || null,
      name,
      symbol,
      uri,
      collection: collection || null,
      size: size || null,
    }
    const data = coder.instruction.encode("createMetadataAccount", request)

    const keys: AccountMeta[] = [
      <AccountMeta> { pubkey: metadataAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: mint, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: mintAuthority, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: payer, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: updateAuthority, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: systemProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: sysvarRentProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: tokenMetadataProgramId, isSigner: false, isWritable: false },
    ]

    return new TransactionInstruction({
      keys,
      programId: nftMarketplaceProgramId,
      data,
    });
  }

  static createMasterEditionInstruction(
    masterEditionAccount: PublicKey,
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    updateAuthority: PublicKey,
    systemProgramId: PublicKey,
    sysvarRentProgramId: PublicKey,
    tokenMetadataProgramId: PublicKey,
    splTokenProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    maxSupply: BN,
  ): TransactionInstruction {

    const request: CreateMasterEditionRequest = {
      maxSupply,
    }

    const data = coder.instruction.encode("createMasterEditionAccount", request)

    const keys: AccountMeta[] = [
      <AccountMeta> { pubkey: masterEditionAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: metadataAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: mint, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: mintAuthority, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: payer, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: updateAuthority, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: systemProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: sysvarRentProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: tokenMetadataProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: splTokenProgramId, isSigner: false, isWritable: false },
    ]

    return new TransactionInstruction({
      keys,
      data,
      programId: nftMarketplaceProgramId,
    });
  }

  static updateMetadataAccountInstruction(
    metadataAccount: PublicKey,
    updateAuthority: PublicKey,
    tokenMetadataProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    newUpdateAuthority?: PublicKey,
    data?: DataV2,
    primarySaleHappened?: boolean,
    isMutable?: boolean,
  ): TransactionInstruction {
    const request: UpdateMetadataAccountRequest = {
      newUpdateAuthority: newUpdateAuthority || null,
      data: data || null,
      primarySaleHappened: primarySaleHappened || null,
      isMutable: isMutable || null,
    }

    const dataInstruction = coder.instruction.encode("updateMetadataAccount", request)

    const keys: AccountMeta[] = [
      <AccountMeta> { pubkey: metadataAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: updateAuthority, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: tokenMetadataProgramId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      data: dataInstruction,
      programId: nftMarketplaceProgramId,
    });
  }

  static initMarketplaceInstruction(
    marketplace: PublicKey,
    splTokenMint: PublicKey,
    feeAccount: PublicKey,
    owner: PublicKey,
    payer: PublicKey,
    systemProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    sellerFeeBasisPoints: number,
    marketplaceBump: number,
    feeBump: number,
  ): TransactionInstruction {

    const request: InitMarketplaceRequest = {
      sellerFeeBasisPoints,
      bump: marketplaceBump,
      feeBump,
    }

    console.log('Marketplace', marketplace.toBase58());

    const data = coder.instruction.encode("initMarketplace", request)

    const keys: AccountMeta[] = [
      <AccountMeta> { pubkey: marketplace, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: splTokenMint, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: feeAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: owner, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: payer, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: systemProgramId, isSigner: false, isWritable: false },
    ]

    return new TransactionInstruction({
      keys: keys,
      data,
      programId: nftMarketplaceProgramId,
    });
  }

  static listNftToMarketplaceInstruction(
    sellerTradeState: PublicKey,
    seller: PublicKey,
    mintNftAccount: PublicKey,
    nftMarketPlaceAccount: PublicKey,
    nftTokenAccount: PublicKey,
    tokenMintAccount: PublicKey,
    programAsSigner: PublicKey,
    tokenProgramId: PublicKey,
    systemProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    listPrice: BN,
    bump: number,
  ): TransactionInstruction {

    const request: ListNftToMarketplaceRequest = {
      listPrice,
      bump,
    };

    console.log('list price', listPrice.toString());

    const data = coder.instruction.encode("listNftToMarketplace", request)

    const keys: AccountMeta[] = [
      <AccountMeta> { pubkey: sellerTradeState, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: seller, isSigner: true, isWritable: false },
      <AccountMeta> { pubkey: mintNftAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: nftMarketPlaceAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: nftTokenAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: tokenMintAccount, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: programAsSigner, isSigner: false, isWritable: true },
      <AccountMeta> { pubkey: tokenProgramId, isSigner: false, isWritable: false },
      <AccountMeta> { pubkey: systemProgramId, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction(
      {
        keys,
        data,
        programId: nftMarketplaceProgramId,
      }
    );
  }

}
