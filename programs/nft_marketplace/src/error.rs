use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {

  #[msg("Price is not correct")]
  PriceNotCorrect,

  #[msg("Seller is not correct")]
  SellerNotCorrect,

  #[msg("Mint NFT account is not correct")]
  MintNFTAccountNotCorrect,

  #[msg("NFT Marketplace account is not correct")]
  NFTMarketplaceAccountNotCorrect,

  #[msg("NFT Token account is not correct")]
  NFTTokenAccountNotCorrect,

  #[msg("Token Mint account is not correct")]
  TokenMintAccountNotCorrect,

  #[msg("Fee account is not owner")]
  FeeAccountNotOwner,

}
