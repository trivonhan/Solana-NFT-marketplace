import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaConfigService } from "@coin98/solana-support-library/config";
import { sendTransaction, TOKEN_PROGRAM_ID } from "@coin98/solana-support-library";
import { Account, createMint, getAccount, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { NftMarketplaceService } from "../services";
import { BN } from "bn.js";
import { DataV2 } from "../services/nft_marketplace_instruction.service";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("nft-collection", () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const encoder = new TextEncoder();

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  const SYSVAR_RENT_PUBKEY = new PublicKey("SysvarRent111111111111111111111111111111111");
  const NFT_MARKETPLACE_PROGRAM_ID: PublicKey = new PublicKey('H4Theeu9v5WwLSSUc9BTtCehCgw2ap6KxekeQkcbgBJz');
  const SPL_TOKEN_PROGRAM_ID: PublicKey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

  // Root public key and keypair
  let root: anchor.web3.Keypair;
  let mint: anchor.web3.PublicKey;
  let metadataAccount: anchor.web3.PublicKey;
  let rootATA:  Account;
  let masterEditionAccount: anchor.web3.PublicKey;

  // Second user public key and keypair
  let user2: anchor.web3.Keypair;
  let user2ATA: Account;
  let user2Mint: anchor.web3.PublicKey;
  let user2MetadataAccount: anchor.web3.PublicKey;
  let nft2MasterEditionAccount : anchor.web3.PublicKey;

  // Token currency (MTT)
  let mintMTT: PublicKey;
  let ownerTokenMTT: Keypair;

  // Marketplace accounts
  let marketplaceAccount: PublicKey;
  let marketplaceBump: number;
  let feeAccount: PublicKey;
  let feeBump: number;
  let feeATA: Account;

  // Delegate account
  let programAsSigner: anchor.web3.PublicKey;
  let programAsSignerBump: number;

  // Sell - Buy account
  let sellerTradeState: anchor.web3.PublicKey;
  let sellerTradeStateBump: number;
  let buyerNftATA: Account;
  let buyerMTTATA: Account;
  let sellerMTTATA: Account;


  before(async () => {
    console.log('Creating root account...');
    // Get root address
    root = await SolanaConfigService.getDefaultAccount();
    console.log('Root account: ', root.publicKey.toBase58());

    // Create user 2
    user2 = anchor.web3.Keypair.generate();
    console.log('User 2: ', user2.publicKey.toBase58());

    // Airdrop to user 2
    await connection.requestAirdrop(
      user2.publicKey,
      LAMPORTS_PER_SOL,
    );

    ownerTokenMTT = anchor.web3.Keypair.generate();
    console.log('Owner Token ', ownerTokenMTT.publicKey.toBase58());

      // Airdrop to user 2
      const airdropSignature = await connection.requestAirdrop(
        ownerTokenMTT.publicKey,
        LAMPORTS_PER_SOL,
      );

      await connection.confirmTransaction(airdropSignature);

    // Create mint
    mint = await createMint(
      connection,
      root,
      root.publicKey,
      root.publicKey,
      0,
    );
    console.log('Mint created: ', mint.toBase58());

    // Create root associated token account
    rootATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mint,
      root.publicKey,
    );
    console.log('Root ATA created: ', rootATA.address.toBase58());
  });

  it("Mint token to root ATA", async () => {
    console.log('Minting first NFT...');
    const mintToTx = await mintTo(
      connection,
      root,
      mint,
      rootATA.address,
      root.publicKey,
      1
    );
    console.log('Minting first NFT done: ', mintToTx);

    const rootATABalance = await getAccount(connection, rootATA.address);
    console.log('Root ATA balance: ', Number(rootATABalance.amount));
  });

  it('Create metadata account', async () => {
    metadataAccount = findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log('Metadata account: ', metadataAccount.toBase58());

    const creator = [
        {
          address: root.publicKey,
          verified: true,
          share: 100,
        }
      ];

    const metadataAccountTx = await NftMarketplaceService.createMetadataAccount(
      connection,
      metadataAccount,
      mint,
      root, // mintAuthority
      root, // payer
      root, // updateAuthority
      SystemProgram.programId,
      SYSVAR_RENT_PUBKEY,
      TOKEN_METADATA_PROGRAM_ID,
      NFT_MARKETPLACE_PROGRAM_ID,
      "Hello NFT",
      "HNFT",
      "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
      creator,
    );

    console.log('Metadata account created: ', metadataAccountTx);
  });

  it('Create master edition account', async () => {
    masterEditionAccount = findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log('Master edition account: ', masterEditionAccount.toBase58());

    const masterEditionAccountTx = await NftMarketplaceService.createMasterEditionAccount(
      connection,
      masterEditionAccount,
      metadataAccount,
      mint,
      root, // mintAuthority
      root, // payer
      root, // updateAuthority
      SystemProgram.programId,
      SYSVAR_RENT_PUBKEY,
      TOKEN_METADATA_PROGRAM_ID,
      SPL_TOKEN_PROGRAM_ID,
      NFT_MARKETPLACE_PROGRAM_ID,
      new BN(1)
    );

    console.log('Master edition account created: ', masterEditionAccountTx);
  });

  it('Update metadata account', async () => {
    const updateData = {
      name: 'Updated NFT',
      symbol: 'UNFT',
      uri: 'https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json',
      sellerFeeBasisPoints: 100,
      creators: [
        {
          address: root.publicKey,
          verified: true,
          share: 100,
        }
      ],
    };
    const updateMetadataAccountTx = await NftMarketplaceService.updateMetadataAccount(
      connection,
      metadataAccount,
      root, // updateAuthority
      TOKEN_METADATA_PROGRAM_ID,
      NFT_MARKETPLACE_PROGRAM_ID,
      undefined,
      updateData,
    )

    console.log('Metadata account updated: ', updateMetadataAccountTx);

  });

  it('Create token currency and ATA for root and user 2', async () => {

      mintMTT = await createMint(
      connection,
      ownerTokenMTT,
      ownerTokenMTT.publicKey,
      ownerTokenMTT.publicKey,
      9,
    );
    console.log('Mint account of MTT ', mintMTT.toBase58());


  })

  it('Init marketplace', async () => {
    [marketplaceAccount, marketplaceBump] = findProgramAddressSync(
      [
        Buffer.from("MARKETPLACE"),
        root.publicKey.toBuffer(),
        mintMTT.toBuffer(),
      ],
    NFT_MARKETPLACE_PROGRAM_ID,
    );

    console.log('Marketplace account: ', marketplaceAccount.toBase58());

    feeATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintMTT,
      root.publicKey,
      true,
    );

    console.log('Fee account: ', feeATA.address.toBase58());

    const initMarketplaceTx = await NftMarketplaceService.initMarketplace(
      connection,
      marketplaceAccount,
      mintMTT,
      feeATA.address,
      root, // owner
      root, // payer
      SystemProgram.programId,
      NFT_MARKETPLACE_PROGRAM_ID,
      200,
      marketplaceBump,
      feeBump,
    );
    console.log('Marketplace initialized: ', initMarketplaceTx);
  });

  it('List NFT to marketplace', async () => {
    const listPrice = new BN(1000 * LAMPORTS_PER_SOL);
    [sellerTradeState, sellerTradeStateBump] = findProgramAddressSync(
      [
        Buffer.from("MARKETPLACE_LISTING"),
        root.publicKey.toBuffer(),
        Buffer.from([(listPrice)]),
        mint.toBuffer(),
        marketplaceAccount.toBuffer(),
        rootATA.address.toBuffer(),
        mintMTT.toBuffer(),
      ],
      NFT_MARKETPLACE_PROGRAM_ID,
    );

    console.log('Seller trade state: ', sellerTradeState.toBase58());

    [programAsSigner, programAsSignerBump] = findProgramAddressSync(
      [
        Buffer.from("MARKETPLACE"),
        Buffer.from("MARKETPLACE_SIGNER"),
      ],
      NFT_MARKETPLACE_PROGRAM_ID,
    );
    console.log('Program as signer: ', programAsSigner.toBase58());

    const listNftTx = await NftMarketplaceService.listNftToMarketplace(
      connection,
      sellerTradeState,
      root, // owner
      mint,
      marketplaceAccount,
      rootATA.address,
      mintMTT,
      root.publicKey,
      programAsSigner,
      TOKEN_PROGRAM_ID,
      SystemProgram.programId,
      NFT_MARKETPLACE_PROGRAM_ID,
      listPrice,
      sellerTradeStateBump,
    );

    console.log('NFT listed to marketplace: ', listNftTx);
  });

  it("Buy NFT", async () => {
    console.log('Buyer: ', user2.publicKey.toBase58());
    console.log('Seller: ', root.publicKey.toBase58());
    // Associated token account of buyer to store NFT
    buyerNftATA = await getOrCreateAssociatedTokenAccount(
      connection,
      user2,
      mint,
      user2.publicKey,
    );
    console.log('User 2 NFT ATA created: ', buyerNftATA.address.toBase58());

    // Associated token account of buyer to store money
    buyerMTTATA = await getOrCreateAssociatedTokenAccount(
      connection,
      user2,
      mintMTT,
      user2.publicKey,
    );
    console.log('User 2 MTT ATA created: ', buyerMTTATA.address.toBase58());

    const mintToTx = await mintTo(
      connection,
      ownerTokenMTT,
      mintMTT,
      buyerMTTATA.address,
      ownerTokenMTT,
      10000 * LAMPORTS_PER_SOL,
    );
    console.log('Minting second NFT done: ', mintToTx);

    /// Associated token account of seller to store money
    sellerMTTATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintMTT,
      root.publicKey,
    );
    console.log('User 2 MTT ATA created: ', sellerMTTATA.address.toBase58());

    // Buy NFT
    const buyNftTx = await NftMarketplaceService.buyNft(
      connection,
      user2,
      root.publicKey,
      buyerNftATA.address,
      buyerMTTATA.address,
      sellerMTTATA.address,
      sellerTradeState,
      mint,
      marketplaceAccount,
      rootATA.address,
      mintMTT,
      programAsSigner,
      root.publicKey,
      feeATA.address,
      TOKEN_PROGRAM_ID,
      SystemProgram.programId,
      NFT_MARKETPLACE_PROGRAM_ID,
      new BN(1000 * LAMPORTS_PER_SOL),
      programAsSignerBump,
    );

    console.log('NFT bought: ', buyNftTx);


  });



  // it('Create second NFT', async () => {
  //   user2 = anchor.web3.Keypair.generate();
  //   console.log('User 2: ', user2.publicKey.toBase58());

  //     // Airdrop to user 2
  //     const airdropSignature = await connection.requestAirdrop(
  //       user2.publicKey,
  //       LAMPORTS_PER_SOL,
  //     );

  //     await connection.confirmTransaction(airdropSignature);

  //   user2Mint = await createMint(
  //     connection,
  //     user2,
  //     user2.publicKey,
  //     user2.publicKey,
  //     0,
  //   );
  //   console.log('User 2 mint: ', user2Mint.toBase58());

  //   user2ATA = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     user2,
  //     user2Mint,
  //     user2.publicKey,
  //   );
  //   console.log('User 2 ATA: ', user2ATA.address.toBase58());

  //   const mintToTx = await mintTo(
  //     connection,
  //     user2,
  //     user2Mint,
  //     user2ATA.address,
  //     user2,
  //     1
  //   );
  //   console.log('Minting second NFT done: ', mintToTx);

  //   user2MetadataAccount = findProgramAddressSync(
  //     [
  //       Buffer.from('metadata'),
  //       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
  //       user2Mint.toBuffer(),
  //     ],
  //     TOKEN_METADATA_PROGRAM_ID,
  //   )[0];
  //   console.log('Metadata account: ', user2MetadataAccount.toBase58());

  //   const creator = [
  //       {
  //         address: user2.publicKey,
  //         verified: true,
  //         share: 100,
  //       }
  //     ];

  //   const metadataAccountTx = await NftMarketplaceService.createMetadataAccount(
  //     connection,
  //     user2MetadataAccount,
  //     user2Mint,
  //     user2, // mintAuthority
  //     user2, // payer
  //     user2, // updateAuthority
  //     SystemProgram.programId,
  //     SYSVAR_RENT_PUBKEY,
  //     TOKEN_METADATA_PROGRAM_ID,
  //     NFT_MARKETPLACE_PROGRAM_ID,
  //     "Hello NFT 2",
  //     "HNFT",
  //     "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
  //     creator,
  //   );

  //   console.log('Metadata account created: ', metadataAccountTx);
  // });




});
