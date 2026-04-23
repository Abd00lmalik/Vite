use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin:           String,
    pub issuer_registry: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    SubmitBatch {
        batch_id:     String,
        merkle_root:  String,
        record_count: u32,
        submitter:    String,
        clinic_id:    String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(BatchResponse)]
    GetBatch { batch_id: String },
    #[returns(AllBatchesResponse)]
    AllBatches { limit: Option<u32> },
    #[returns(VerifyResponse)]
    VerifyRecord {
        batch_id:    String,
        record_hash: String,
        proof:       Vec<String>,
    },
}

#[cw_serde]
pub struct BatchRecord {
    pub batch_id:     String,
    pub merkle_root:  String,
    pub record_count: u32,
    pub submitter:    String,
    pub clinic_id:    String,
    pub submitted_at: u64,
    pub tx_height:    u64,
}

#[cw_serde]
pub struct BatchResponse     { pub batch: BatchRecord }
#[cw_serde]
pub struct AllBatchesResponse { pub batches: Vec<BatchRecord> }
#[cw_serde]
pub struct VerifyResponse    { pub valid: bool }
