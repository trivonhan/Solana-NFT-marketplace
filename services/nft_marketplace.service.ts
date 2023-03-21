import { sendRawTransaction2, sendTransaction2, TransactionLog } from "@coin98/solana-support-library";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { Collection, Creator, DataV2, NftMarketplaceInstructionService } from "./nft_marketplace_instruction.service";

export class NftMarketplaceService {

  static async createMetadataAccount(
    connection: Connection,
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: Keypair,
    payer: Keypair,
    updateAuthority: Keypair,
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
  ): Promise<[string, TransactionLog]>{
    const transaction = new Transaction();

    const createMetadataAccountInstruction = NftMarketplaceInstructionService.createMetadataAccountInstruction(
      metadataAccount,
      mint,
      mintAuthority.publicKey,
      payer.publicKey,
      updateAuthority.publicKey,
      systemProgramId,
      sysvarRentProgramId,
      tokenMetadataProgramId,
      nftMarketplaceProgramId,
      name,
      symbol,
      uri,
      creators,
      collection,
      size,
    );
    transaction.add(createMetadataAccountInstruction);
    console.log('Transaction: ', transaction);
    const txSign = await sendTransaction2(connection, transaction, [payer, updateAuthority, mintAuthority])

    return txSign;
  }

  static async createMasterEditionAccount(
    connection: Connection,
    masterEditionAccount: PublicKey,
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: Keypair,
    payer: Keypair,
    updateAuthority: Keypair,
    systemProgramId: PublicKey,
    sysvarRentProgramId: PublicKey,
    tokenMetadataProgramId: PublicKey,
    splTokenProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    maxSupply: BN,
  ): Promise<[string, TransactionLog]> {

    const transaction = new Transaction();
    const createMasterEditionInstruction = NftMarketplaceInstructionService.createMasterEditionInstruction(
      masterEditionAccount,
      metadataAccount,
      mint,
      mintAuthority.publicKey,
      payer.publicKey,
      updateAuthority.publicKey,
      systemProgramId,
      sysvarRentProgramId,
      tokenMetadataProgramId,
      splTokenProgramId,
      nftMarketplaceProgramId,
      maxSupply,
    );
    transaction.add(createMasterEditionInstruction);
    const txSign = await sendTransaction2(connection, transaction, [payer, updateAuthority, mintAuthority])

    return txSign;

  }

  static async updateMetadataAccount(
    connection: Connection,
    metadataAccount: PublicKey,
    updateAuthority: Keypair,
    tokenMetadataProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    newUpdateAuthority?: PublicKey,
    dataV2?: DataV2,
    primarySaleHappened?: boolean,
    isMutable?: boolean,
  ): Promise<[string, TransactionLog]> {

    const transaction = new Transaction();
    const updateMetadataAccountInstruction = NftMarketplaceInstructionService.updateMetadataAccountInstruction(
      metadataAccount,
      updateAuthority.publicKey,
      tokenMetadataProgramId,
      nftMarketplaceProgramId,
      newUpdateAuthority,
      dataV2,
      primarySaleHappened,
      isMutable,
    );
    transaction.add(updateMetadataAccountInstruction);
    const txSign = await sendTransaction2(connection, transaction, [updateAuthority])

    return txSign;

  }

  static async initMarketplace(
    connection: Connection,
    marketplaceAccount: PublicKey,
    splTokenMint: PublicKey,
    feeAccount: PublicKey,
    owner: Keypair,
    payer: Keypair,
    systemProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    sellerFeeBasisPoints: number,
    marketplaceBump: number,
    feeBump: number,
  ): Promise<[string, TransactionLog]> {

    const transaction = new Transaction();

    const initMarketplaceInstruction = NftMarketplaceInstructionService.initMarketplaceInstruction(
      marketplaceAccount,
      splTokenMint,
      feeAccount,
      owner.publicKey,
      payer.publicKey,
      systemProgramId,
      nftMarketplaceProgramId,
      sellerFeeBasisPoints,
      marketplaceBump,
      feeBump,
    );

    transaction.add(initMarketplaceInstruction);

    const txSign = await sendTransaction2(connection, transaction, [payer, owner])
    return txSign;
  }

  static async listNftToMarketplace(
    connection: Connection,
    sellerTradeState: PublicKey,
    seller: Keypair,
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
  ): Promise<[string, TransactionLog]> {
    const transaction = new Transaction();

    const listNftToMarketplaceInstruction = NftMarketplaceInstructionService.listNftToMarketplaceInstruction(
      sellerTradeState,
      seller.publicKey,
      mintNftAccount,
      nftMarketPlaceAccount,
      nftTokenAccount,
      tokenMintAccount,
      programAsSigner,
      tokenProgramId,
      systemProgramId,
      nftMarketplaceProgramId,
      listPrice,
      bump,
    );

    transaction.add(listNftToMarketplaceInstruction);

    const txSign = await sendTransaction2(connection, transaction, [seller])
    return txSign;

  }

  static async buyNft(
    connection: Connection,
    buyer: Keypair,
    seller: PublicKey,
    buyerNftAccount: PublicKey,
    buyerTokenAccount: PublicKey,
    sellerTokenAccount: PublicKey,
    sellerTradeState: PublicKey,
    mintNftAccount: PublicKey,
    nftMarketPlaceAccount: PublicKey,
    nftTokenAccount: PublicKey,
    tokenMintAccount: PublicKey,
    programAsSigner: PublicKey,
    authority: PublicKey,
    feeAccount: PublicKey,
    tokenProgramId: PublicKey,
    systemProgramId: PublicKey,
    nftMarketplaceProgramId: PublicKey,
    amount: BN,
    bump: number,
  ): Promise<[string, TransactionLog]> {
    const transaction = new Transaction();

    const buyNftFromMarketplaceInstruction = NftMarketplaceInstructionService.buyNftInstruction(
      buyer.publicKey,
      seller,
      buyerNftAccount,
      buyerTokenAccount,
      sellerTokenAccount,
      sellerTradeState,
      mintNftAccount,
      nftMarketPlaceAccount,
      nftTokenAccount,
      tokenMintAccount,
      programAsSigner,
      authority,
      feeAccount,
      tokenProgramId,
      systemProgramId,
      nftMarketplaceProgramId,
      amount,
      bump,
    );

    transaction.add(buyNftFromMarketplaceInstruction);

    const txSign = await sendTransaction2(connection, transaction, [buyer])
    return txSign;

  }

}
