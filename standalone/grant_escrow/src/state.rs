use cw_storage_plus::{Item, Map};
use cosmwasm_std::Addr;
use crate::msg::GrantEvent;

pub const ADMIN:             Item<Addr>               = Item::new("admin");
pub const MILESTONE_CHECKER: Item<Addr>               = Item::new("milestone_checker");
pub const PROGRAM_BALANCES:  Map<&str, u128>          = Map::new("prog_balances");
pub const TOTAL_RELEASED:    Map<&str, u128>          = Map::new("prog_released");
pub const GRANT_HISTORY:     Map<(&str, u64), GrantEvent> = Map::new("grants");
pub const GRANT_COUNTER:     Item<u64>                = Item::new("grant_ctr");
