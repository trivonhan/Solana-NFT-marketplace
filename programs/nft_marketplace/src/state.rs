use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Collection {
    pub verified: bool,
    pub key: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum UseMethod {
    Burn,
    Multiple,
    Single,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Uses {
    // 17 bytes + Option byte
    pub use_method: UseMethod, //1
    pub remaining: u64,        //8
    pub total: u64,            //8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DataV2 {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    /// Array of creators, optional
    pub creators: Option<Vec<Creator>>,
    /// Collection
    pub collection: Option<Collection>,
    /// Uses
    pub uses: Option<Uses>,
}


// Marketplace state
#[account]
#[derive(Default)]
pub struct MarketplaceNFT {
    pub spl_token_mint: Pubkey,     // The mint address of the token to be used as the Marketplace currency
    pub fee_account: Pubkey,        // Account to receive fees
    pub seller_fee_basis_points: u16,  // Percent fee to take from seller
    pub owner: Pubkey,            // The public key of the Marketplace instance creator
    pub bump: u8,                   // Bump seed for the Marketplace instance
    pub fee_bump: u8,               // Bump seed for the fee account
}

#[account]
#[derive(Default)]
pub struct SellerTradeState {
    pub seller: Pubkey, // The public key of the seller
    pub bump: u8,       // Bump seed for the seller
    pub list_price: u64, // The price the seller is asking for
    pub mint_nft_account: Pubkey, // The mint account of the NFT
    pub nft_marketplace_account: Pubkey, // The NFT marketplace account
    pub nft_token_account: Pubkey, // The NFT token account
    pub token_mint_account: Pubkey, // The token mint account (token currency)
}
