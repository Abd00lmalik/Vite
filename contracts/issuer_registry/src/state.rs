use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkerRecord {
    pub clinic_id:    String,
    pub clinic_name:  String,
    pub credentialed: bool,
    pub registered_at: u64,
}

pub const ADMIN:   Item<Addr>              = Item::new("admin");
pub const WORKERS: Map<&str, WorkerRecord> = Map::new("workers");
