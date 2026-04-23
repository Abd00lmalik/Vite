use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin:             String,
    pub milestone_checker: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Payable — attach uxion to fund a program
    FundProgram { program_id: String },
    /// Only callable by milestone_checker
    ReleaseGrant {
        program_id:   String,
        patient_addr: String,
        patient_id:   String,
        milestone_id: String,
        amount:       u128,
    },
    UpdateChecker { milestone_checker: String },
    WithdrawAdmin { program_id: String, amount: u128 },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(BalanceResponse)]
    ProgramBalance { program_id: String },
    #[returns(TotalReleasedResponse)]
    TotalReleased { program_id: String },
    #[returns(GrantHistoryResponse)]
    GrantHistory { program_id: String, limit: Option<u32> },
}

#[cw_serde]
pub struct GrantEvent {
    pub patient_addr: String,
    pub patient_id:   String,
    pub milestone_id: String,
    pub amount:       u128,
    pub released_at:  u64,
    pub tx_height:    u64,
}

#[cw_serde]
pub struct BalanceResponse      { pub balance: u128 }
#[cw_serde]
pub struct TotalReleasedResponse { pub total: u128 }
#[cw_serde]
pub struct GrantHistoryResponse { pub grants: Vec<GrantEvent> }
