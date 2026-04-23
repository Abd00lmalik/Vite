use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin:              String,
    pub vaccination_record: String,
    pub grant_escrow:       String,
}

#[cw_serde]
pub struct MilestoneConfig {
    pub milestone_id: String,
    pub program_id:   String,
    pub vaccine_name: String,
    pub dose_number:  u32,
    pub grant_amount: u128,
    pub active:       bool,
}

#[cw_serde]
pub enum ExecuteMsg {
    AddMilestone { config: MilestoneConfig },
    RemoveMilestone { milestone_id: String },
    CheckAndRelease {
        patient_addr: String,
        patient_id:   String,
        vaccine_name: String,
        dose_number:  u32,
        program_id:   String,
        batch_id:     String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(MilestoneResponse)]
    GetMilestone { milestone_id: String },
    #[returns(AllMilestonesResponse)]
    AllMilestones {},
    #[returns(CheckResponse)]
    CheckEligibility {
        patient_id:   String,
        vaccine_name: String,
        dose_number:  u32,
        program_id:   String,
    },
}

#[cw_serde]
pub struct MilestoneResponse     { pub milestone: MilestoneConfig }
#[cw_serde]
pub struct AllMilestonesResponse { pub milestones: Vec<MilestoneConfig> }
#[cw_serde]
pub struct CheckResponse         { pub eligible: bool, pub amount: u128 }
