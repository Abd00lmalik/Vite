use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    CredentialWorker {
        worker_addr: String,
        clinic_id:   String,
        clinic_name: String,
    },
    RevokeWorker {
        worker_addr: String,
    },
    UpdateAdmin {
        new_admin: String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(IsCredentialedResponse)]
    IsCredentialed { address: String },
    #[returns(WorkerInfoResponse)]
    WorkerInfo { address: String },
    #[returns(AllWorkersResponse)]
    AllWorkers { limit: Option<u32> },
}

#[cw_serde]
pub struct IsCredentialedResponse {
    pub credentialed: bool,
}

#[cw_serde]
pub struct WorkerInfoResponse {
    pub worker_addr:   String,
    pub clinic_id:     String,
    pub clinic_name:   String,
    pub credentialed:  bool,
    pub registered_at: u64,
}

#[cw_serde]
pub struct AllWorkersResponse {
    pub workers: Vec<WorkerInfoResponse>,
}
