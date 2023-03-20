use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {

  #[msg("Invalid account")]
  InvalidAccount,

  #[msg("Invalid input")]
  InvalidInput,
}
