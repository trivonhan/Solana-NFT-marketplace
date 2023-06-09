use anchor_lang::prelude::*;

use crate::state::*;
use crate::constant::*;
use crate::error::ErrorCode::*;

use crate::external::{
    anchor_spl_token::{
      TokenAccount,
    },
    spl_token::{
      is_token_program
    },
  };

#[derive(Accounts)]
pub struct CreateMetadataAccountsContext<'info> {

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

}

#[derive(Accounts)]
pub struct CreateMasterEditionAccountContext<'info> {

    /// CHECK: Master edition account
    #[account(mut)]
    pub master_edition_account: AccountInfo<'info>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateMetadataAccountContext<'info> {

    /// CHECK: Metadata account of the NFT (which is the first chosen for the collection )
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Collection Update authority
    pub update_authority: Signer<'info>,

    /// CHECK: Metaplex will check this (TOKEN METADATA PROGRAM ID)
    pub token_metadata_program: AccountInfo<'info>,
}

// Marketplace
#[derive(Accounts)]
pub struct InitMarketplaceContext<'info> {

    #[account(
        init,
        seeds = [MARKETPLACE, &owner.key().as_ref(), &spl_token_mint.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + 32 + 32 + 2 + 32 + 8 + 1,
    )]
    pub marketplace: Account<'info, MarketplaceNFT>,

    /// CHECK: The mint address of the token to be used as the Marketplace currency
    #[account(mut)]
    pub spl_token_mint: AccountInfo<'info>,

    /// CHECK: Associated token account for the fee account
    #[account(
        mut,
        constraint = fee_account.owner.to_string() == FEE_OWNER @FeeAccountNotOwner,
        constraint = fee_account.mint.to_string() == spl_token_mint.key().to_string() @FeeAccountNotOwner,
    )]
    pub fee_account: Account<'info, TokenAccount>,

    /// CHECK: The public key of the Marketplace instance creator
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Bump seed for the Marketplace instance
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
#[instruction(list_price: u8)]
pub struct ListingNftContext<'info> {

    #[account(
        init,
        seeds = [
            LISTING,
            &seller.key().as_ref(),
            &[list_price],
            mint_nft_account.key().as_ref(),
            nft_marketplace_account.key().as_ref(),
            nft_token_account.key().as_ref(),
            token_mint_account.key().as_ref(),
        ],
        bump,
        payer = seller,
        space = 8 + 32 + 1 + 8 + 32 + 32 + 32 + 32,
    )]
    pub seller_trade_state: Account<'info, SellerTradeState>,

    /// CHECK: The public key of the seller listing NFT to marketplace
    #[account(mut)]
    pub seller: Signer<'info>,

    /// CHECK: The public key of mint NFT being listing to marketplace
    #[account(mut)]
    pub mint_nft_account: AccountInfo<'info>,

    /// CHECK: The public key of Marketplace account instance
    #[account(
        mut,
        seeds=[MARKETPLACE, &authority.key().as_ref(), &token_mint_account.key().as_ref()],
        bump
    )]
    pub nft_marketplace_account: AccountInfo<'info>,

    /// CHECK: The public key of NFT token account
    #[account(mut)]
    pub nft_token_account: AccountInfo<'info>,

    /// CHECK: The mint address of the token to be used as the Marketplace currency
    #[account(mut)]
    pub token_mint_account: AccountInfo<'info>,

    /// CHECK: The public key of the Marketplace instance creator
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    /// CHECK: Not dangerous. Account seeds checked in constraint.
    #[account(
        mut,
        seeds=[MARKETPLACE, SIGNER],
        bump
    )]
    pub program_as_signer: UncheckedAccount<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(amount: u8)]
pub struct BuyNftContext<'info> {

    /// CHECK: The public key of the buyer
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: The public key of the seller listing NFT to marketplace
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    /// CHECK: Associated token account of buyer to store NFT
    #[account(mut)]
    pub buyer_nft_account: AccountInfo<'info>,

    /// CHECK: Associated token account of buyer to store money
    #[account(mut)]
    pub buyer_token_account: AccountInfo<'info>,

    /// CHECK: Associated token account of seller to store money
    #[account(mut)]
    pub seller_token_account: AccountInfo<'info>,

    /// CHECK: Seller trade state account
    #[account(
        mut,
        seeds = [
            LISTING,
            &seller.key().as_ref(),
            &[amount],
            mint_nft_account.key().as_ref(),
            nft_marketplace_account.key().as_ref(),
            nft_token_account.key().as_ref(),
            token_mint_account.key().as_ref(),
        ],
        bump,
    )]
    pub seller_trade_state: Account<'info, SellerTradeState>,

    /// CHECK: The public key of mint NFT being listing to marketplace
    #[account(mut)]
    pub mint_nft_account: AccountInfo<'info>,

    /// CHECK: The public key of Marketplace account instance
    #[account(
        mut,
        seeds = [MARKETPLACE, &authority.key().as_ref(), &token_mint_account.key().as_ref()],
        bump,
    )]
    pub nft_marketplace_account: Account<'info, MarketplaceNFT>,

    /// CHECK: The public key of associated token account of seller
    #[account(mut)]
    pub nft_token_account: AccountInfo<'info>,

    /// CHECK: The mint address of the token to be used as the Marketplace currency
    #[account(mut)]
    pub token_mint_account: AccountInfo<'info>,

    /// CHECK: Not dangerous. Account seeds checked in constraint.
    #[account(
        mut,
        seeds=[MARKETPLACE, SIGNER],
        bump
    )]
    pub program_as_signer: UncheckedAccount<'info>,

    /// CHECK: Creator of marketplace instance
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    /// CHECK: Associated token account for the fee account
    #[account(
        mut,
        constraint = fee_account.owner.to_string() == FEE_OWNER @FeeAccountNotOwner,
        constraint = fee_account.mint.to_string() == token_mint_account.key().to_string() @FeeAccountNotOwner,
    )]
    pub fee_account: Account<'info, TokenAccount>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct WithdrawFromFeeAccountContext<'info> {

    /// CHECK: Associated token account for the fee account
    #[account(
        mut,
        constraint = fee_account.owner.to_string() == FEE_OWNER @FeeAccountNotOwner,
        constraint = fee_account.mint.to_string() == token_mint_account.key().to_string() @FeeAccountNotOwner,
    )]
    pub fee_account: Account<'info, TokenAccount>,

    /// CHECK: The public key of the Marketplace instance creator
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub destination_account: AccountInfo<'info>,

    /// CHECK: The mint address of the token to be used as the Marketplace currency
    #[account(mut)]
    pub token_mint_account: AccountInfo<'info>,

}
