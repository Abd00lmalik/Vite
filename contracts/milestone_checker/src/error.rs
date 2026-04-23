use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("Unauthorized")]
    Unauthorized {},
    #[error("Worker not credentialed")]
    NotCredentialed {},
    #[error("Milestone already released")]
    AlreadyReleased {},
    #[error("Insufficient escrow balance")]
    InsufficientBalance {},
    #[error("Program not found")]
    ProgramNotFound {},
    #[error("Invalid funds")]
    InvalidFunds {},
    #[error("Milestone not found")]
    MilestoneNotFound {},
}
