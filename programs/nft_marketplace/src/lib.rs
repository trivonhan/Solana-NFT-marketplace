pub mod constant;
pub mod context;
pub mod error;
pub mod event;
pub mod state;
pub mod external;

use anchor_lang::{
  prelude::*,
  solana_program::{
    program::{
        invoke,
        invoke_signed
    },
    sysvar::rent::Rent,
    instruction:: {
        Instruction,
    }
  },
};
use context::*;

use mpl_token_metadata::{
  instruction as mpl_instruction,
  ID as TOKEN_METADATA_ID,
    state::{
        Creator,
        Collection,
        DataV2
    }
};

use crate::external::spl_token::{
    ID as TOKEN_PROGRAM_ID,
  };

declare_id!("H4Theeu9v5WwLSSUc9BTtCehCgw2ap6KxekeQkcbgBJz");

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct ApproveTokenParams {
    pub instruction: u8,
    pub amount: u64,
}

#[program]
mod nft_marketplace {
  use super::*;

  pub fn create_metadata_account(
    ctx: Context<CreateMetadataAccountsContext>,
    creators: Option<Vec<Creator>>,
    name: String,
    symbol: String,
    uri: String,
    collection: Option<Collection>,
    size: Option<u64>,
    ) -> Result<()> {
        let metadata_account = &ctx.accounts.metadata_account;
        let mint_authority = &ctx.accounts.mint_authority;
        let payer = &ctx.accounts.payer;
        let update_authority = &ctx.accounts.update_authority;
        let mint = &ctx.accounts.mint;
        let system_program = &ctx.accounts.system_program;
        let rent = &ctx.accounts.rent;
        let token_metadata_program = &ctx.accounts.token_metadata_program;

        let token_collection_details : Option<mpl_token_metadata::state::CollectionDetails>;

        if let Some(size) = size {
            token_collection_details = Some(
                mpl_token_metadata::state::CollectionDetails::V1 {
                    size,
                }
            )
        }
        else {
            token_collection_details = None;
        }

        let instruction = mpl_instruction::create_metadata_accounts_v3(
            TOKEN_METADATA_ID,
            metadata_account.key(),
            mint.key(),
            mint_authority.key(),
            payer.key(),
            update_authority.key(),
            name,
            symbol,
            uri,
            creators,
            0,
            true,
            true,
            collection,
            None,
            token_collection_details,
        );
        msg!("DEBUG: create metadata {:?}", instruction);

        invoke(
            &instruction,
            &[
                metadata_account.to_account_info(),
                mint.to_account_info(),
                mint_authority.to_account_info(),
                payer.to_account_info(),
                update_authority.to_account_info(),
                system_program.to_account_info(),
                rent.to_account_info(),
                token_metadata_program.to_account_info(),
            ])
        .expect("CPI failed");
        Ok(())
    }

    pub fn create_master_edition_account(ctx: Context<CreateMasterEditionAccountContext>, max_supply: u64) -> Result<()> {
        let master_edition_account = &ctx.accounts.master_edition_account;
        let metadata_account = &ctx.accounts.metadata_account;
        let mint = &ctx.accounts.mint;
        let mint_authority = &ctx.accounts.mint_authority;
        let payer = &ctx.accounts.payer;
        let update_authority = &ctx.accounts.update_authority;
        let system_program = &ctx.accounts.system_program;
        let rent = &ctx.accounts.rent;
        let token_metadata_program = &ctx.accounts.token_metadata_program;
        let token_program = &ctx.accounts.token_program;

        let instruction = mpl_instruction::create_master_edition_v3(
            TOKEN_METADATA_ID,
            master_edition_account.key(),
            mint.key(),
            update_authority.key(),
            mint_authority.key(),
            metadata_account.key(),
            payer.key(),
            Some(max_supply),
        );

        msg!("DEBUG: Create master edition instruction {:?}", instruction);

        invoke(&instruction, &[
            metadata_account.to_account_info(),
            mint.to_account_info(),
            mint_authority.to_account_info(),
            payer.to_account_info(),
            update_authority.to_account_info(),
            system_program.to_account_info(),
            rent.to_account_info(),
            token_metadata_program.to_account_info(),
            master_edition_account.to_account_info(),
            token_program.to_account_info(),
        ])
        .expect("CPI failed");

        Ok(())
    }

    pub fn update_metadata_account(
        ctx: Context<UpdateMetadataAccountContext>,
        new_update_authority: Option<Pubkey>,
        data: Option<DataV2>,
        primary_sale_happened: Option<bool>,
        is_mutable: Option<bool>
    ) -> Result<()> {
        let metadata_account = &ctx.accounts.metadata_account;
        let update_authority = &ctx.accounts.update_authority;
        let token_metadata_program = &ctx.accounts.token_metadata_program;
        let update_data: Option<mpl_token_metadata::state::DataV2>;

        if let Some(data_record) = data {
            msg!("Update data: {:?}", data_record.clone());
            update_data = Some(data_record.into());
        } else {
            update_data = None;
        }

        let instruction = mpl_instruction::update_metadata_accounts_v2(
            TOKEN_METADATA_ID,
            metadata_account.key(),
            update_authority.key(),
            new_update_authority,
            update_data,
            primary_sale_happened,
            is_mutable
        );

        invoke(&instruction, &[
            metadata_account.to_account_info(),
            update_authority.to_account_info(),
            token_metadata_program.to_account_info(),
        ]).expect("CPI failed");

        Ok(())
    }

    pub fn init_marketplace(
        ctx: Context<InitMarketplaceContext>,
        seller_fee_basis_points: u16,
        bump: u8,
        fee_bump: u8,
        ) -> Result<()> {
            let marketplace = &mut ctx.accounts.marketplace;
            let spl_token_mint = &ctx.accounts.spl_token_mint;
            let fee_account = &ctx.accounts.fee_account;
            let owner = &ctx.accounts.owner;

            marketplace.seller_fee_basis_points = seller_fee_basis_points;
            marketplace.spl_token_mint = *spl_token_mint.to_account_info().key;
            marketplace.fee_account = *fee_account.to_account_info().key;
            marketplace.bump = bump;
            marketplace.fee_bump = fee_bump;
            marketplace.owner = *owner.to_account_info().key;

            Ok(())
    }

    pub fn list_nft_to_marketplace(
        ctx: Context<ListingNftContext>,
        list_price: u64,
        bump: u8
    ) -> Result<()> {

        let seller_trade_state = &mut ctx.accounts.seller_trade_state;
        let seller = &ctx.accounts.seller;
        let mint_nft_account = &ctx.accounts.mint_nft_account;
        let nft_marketplace_account = &ctx.accounts.nft_marketplace_account;
        let nft_token_account = &ctx.accounts.nft_token_account;
        let token_mint_account = &ctx.accounts.token_mint_account;
        let program_as_signer = &ctx.accounts.program_as_signer;
        let token_program = &ctx.accounts.token_program;

        seller_trade_state.list_price = list_price;
        seller_trade_state.seller = *seller.to_account_info().key;
        seller_trade_state.mint_nft_account = *mint_nft_account.to_account_info().key;
        seller_trade_state.nft_marketplace_account = *nft_marketplace_account.to_account_info().key;
        seller_trade_state.nft_token_account = *nft_token_account.to_account_info().key;
        seller_trade_state.token_mint_account = *token_mint_account.to_account_info().key;
        seller_trade_state.bump = bump;

        let data = ApproveTokenParams {
            instruction: 4,
            amount: 1,
        };

        let data = data.try_to_vec().unwrap();

        let accounts = vec![
            AccountMeta::new(*nft_token_account.key, false),
            AccountMeta::new(*program_as_signer.key, false),
            AccountMeta::new_readonly(*seller.key, true),
        ];

        let instruction = Instruction {
            program_id: *token_program.key,
            accounts,
            data,
        };

        msg!("DEBUG: Delegate account instruction {:?}", instruction);

        invoke(&instruction, &[
            nft_token_account.clone(),
            program_as_signer.to_account_info().clone(),
            seller.to_account_info().clone(),
            token_program.clone(),
        ]).expect("CPI failed");

        Ok(())
    }


}
