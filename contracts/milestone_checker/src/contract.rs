#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult, Uint128, WasmMsg,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str    = "vite:milestone-checker";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    ADMIN.save(deps.storage, &deps.api.addr_validate(&msg.admin)?)?;
    VACCINATION_RECORD.save(deps.storage, &deps.api.addr_validate(&msg.vaccination_record)?)?;
    GRANT_ESCROW.save(deps.storage, &deps.api.addr_validate(&msg.grant_escrow)?)?;
    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", msg.admin))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::AddMilestone { config } => {
            let admin = ADMIN.load(deps.storage)?;
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            MILESTONES.save(deps.storage, &config.milestone_id, &config)?;
            Ok(Response::new()
                .add_attribute("action", "add_milestone")
                .add_attribute("milestone_id", config.milestone_id)
                .add_attribute("program_id", config.program_id))
        }
        ExecuteMsg::RemoveMilestone { milestone_id } => {
            let admin = ADMIN.load(deps.storage)?;
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            MILESTONES.update(deps.storage, &milestone_id, |m| -> StdResult<_> {
                let mut cfg = m.ok_or(cosmwasm_std::StdError::not_found("milestone"))?;
                cfg.active = false;
                Ok(cfg)
            })?;
            Ok(Response::new().add_attribute("action", "remove_milestone"))
        }
        ExecuteMsg::CheckAndRelease {
            patient_addr,
            patient_id,
            vaccine_name,
            dose_number,
            program_id,
            batch_id,
        } => {
            // Find matching active milestone
            let milestones: StdResult<Vec<_>> = MILESTONES
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .collect();
            let milestones = milestones?;

            let matching = milestones.iter().find(|(_, cfg)| {
                cfg.active
                    && cfg.vaccine_name == vaccine_name
                    && cfg.dose_number == dose_number
                    && cfg.program_id == program_id
            });

            let (milestone_id, cfg) = match matching {
                Some((id, cfg)) => (id.clone(), cfg.clone()),
                None => {
                    // No matching milestone — not an error, just skip
                    return Ok(Response::new()
                        .add_attribute("action", "check_and_release")
                        .add_attribute("result", "no_match"));
                }
            };

            // Check if already released
            let already = RELEASED
                .may_load(deps.storage, (&patient_id, &milestone_id))?
                .unwrap_or(false);
            if already {
                return Err(ContractError::AlreadyReleased {});
            }

            // Mark released
            RELEASED.save(deps.storage, (&patient_id, &milestone_id), &true)?;

            // Send message to GrantEscrow.ReleaseGrant
            let escrow = GRANT_ESCROW.load(deps.storage)?;
            let release_msg: CosmosMsg = CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: escrow.to_string(),
                msg: to_json_binary(&serde_json::json!({
                    "release_grant": {
                        "program_id":   program_id,
                        "patient_addr": patient_addr,
                        "patient_id":   patient_id,
                        "milestone_id": milestone_id,
                        "amount":       cfg.grant_amount,
                    }
                }))?,
                funds: vec![],
            });

            Ok(Response::new()
                .add_message(release_msg)
                .add_attribute("action", "check_and_release")
                .add_attribute("milestone_id", milestone_id)
                .add_attribute("patient_addr", patient_addr)
                .add_attribute("grant_amount", cfg.grant_amount.to_string())
                .add_attribute("batch_id", batch_id))
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetMilestone { milestone_id } => {
            let milestone = MILESTONES.load(deps.storage, &milestone_id)?;
            to_json_binary(&MilestoneResponse { milestone })
        }
        QueryMsg::AllMilestones {} => {
            let milestones: StdResult<Vec<_>> = MILESTONES
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .map(|r| Ok(r?.1))
                .collect();
            to_json_binary(&AllMilestonesResponse { milestones: milestones? })
        }
        QueryMsg::CheckEligibility {
            patient_id,
            vaccine_name,
            dose_number,
            program_id,
        } => {
            let milestones: StdResult<Vec<_>> = MILESTONES
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .collect();
            let milestones = milestones?;
            let matching = milestones.iter().find(|(_, cfg)| {
                cfg.active
                    && cfg.vaccine_name == vaccine_name
                    && cfg.dose_number == dose_number
                    && cfg.program_id == program_id
            });
            match matching {
                Some((id, cfg)) => {
                    let already = RELEASED
                        .may_load(deps.storage, (&patient_id, id.as_str()))?
                        .unwrap_or(false);
                    to_json_binary(&CheckResponse {
                        eligible: !already,
                        amount:   cfg.grant_amount,
                    })
                }
                None => to_json_binary(&CheckResponse { eligible: false, amount: 0 }),
            }
        }
    }
}
