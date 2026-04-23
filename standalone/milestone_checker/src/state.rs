use cw_storage_plus::{Item, Map};
use cosmwasm_std::Addr;
use crate::msg::MilestoneConfig;

pub const ADMIN:              Item<Addr>                 = Item::new("admin");
pub const VACCINATION_RECORD: Item<Addr>                 = Item::new("vaccination_record");
pub const GRANT_ESCROW:       Item<Addr>                 = Item::new("grant_escrow");
pub const MILESTONES:         Map<&str, MilestoneConfig> = Map::new("milestones");
// Track (patient_id, milestone_id) pairs already released
pub const RELEASED: Map<(&str, &str), bool>              = Map::new("released");
