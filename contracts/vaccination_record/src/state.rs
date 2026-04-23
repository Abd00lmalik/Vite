use cw_storage_plus::{Item, Map};
use cosmwasm_std::Addr;
use crate::msg::BatchRecord;

pub const ADMIN:           Item<Addr>              = Item::new("admin");
pub const ISSUER_REGISTRY: Item<Addr>              = Item::new("issuer_registry");
pub const BATCHES:         Map<&str, BatchRecord>  = Map::new("batches");
pub const BATCH_COUNT:     Item<u64>               = Item::new("batch_count");
