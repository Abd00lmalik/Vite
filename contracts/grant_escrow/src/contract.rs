#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut,
    Env, MessageInfo, Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str    = "vite:grant-escrow";
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
    MILESTONE_CHECKER.save(deps.storage, &deps.api.addr_validate(&msg.milestone_checker)?)?;
    GRANT_COUNTER.save(deps.storage, &0u64)?;
    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", msg.admin)
        .add_attribute("milestone_checker", msg.milestone_checker))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::FundProgram { program_id } => {
            // Accept uxion funds
            let amount: u128 = info
                .funds
                .iter()
                .find(|c| c.denom == "uxion")
                .map(|c| c.amount.u128())
                .unwrap_or(0);
            if amount == 0 {
                return Err(ContractError::InvalidFunds {});
            }
            let current = PROGRAM_BALANCES
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            PROGRAM_BALANCES.save(deps.storage, &program_id, &(current + amount))?;
            Ok(Response::new()
                .add_attribute("action", "fund_program")
                .add_attribute("program_id", program_id)
                .add_attribute("amount", amount.to_string())
                .add_attribute("funder", info.sender))
        }

        ExecuteMsg::ReleaseGrant {
            program_id,
            patient_addr,
            patient_id,
            milestone_id,
            amount,
        } => {
            // Only milestone_checker can call
            let checker = MILESTONE_CHECKER.load(deps.storage)?;
            if info.sender != checker {
                return Err(ContractError::Unauthorized {});
            }

            // Check balance
            let balance = PROGRAM_BALANCES
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            if balance < amount {
                return Err(ContractError::InsufficientBalance {});
            }

            // Deduct from balance
            PROGRAM_BALANCES.save(deps.storage, &program_id, &(balance - amount))?;

            // Add to total released
            let released = TOTAL_RELEASED
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            TOTAL_RELEASED.save(deps.storage, &program_id, &(released + amount))?;

            // Record grant event
            let counter = GRANT_COUNTER.load(deps.storage)?;
            GRANT_HISTORY.save(
                deps.storage,
                (&program_id, counter),
                &GrantEvent {
                    patient_addr: patient_addr.clone(),
                    patient_id:   patient_id.clone(),
                    milestone_id: milestone_id.clone(),
                    amount,
                    released_at:  env.block.time.seconds(),
                    tx_height:    env.block.height,
                },
            )?;
            GRANT_COUNTER.save(deps.storage, &(counter + 1))?;

            // Send uxion to patient
            let send_msg: CosmosMsg = CosmosMsg::Bank(BankMsg::Send {
                to_address: patient_addr.clone(),
                amount:     vec![Coin { denom: "uxion".to_string(), amount: Uint128::from(amount) }],
            });

            Ok(Response::new()
                .add_message(send_msg)
                .add_attribute("action", "release_grant")
                .add_attribute("program_id", program_id)
                .add_attribute("patient", patient_addr)
                .add_attribute("milestone_id", milestone_id)
                .add_attribute("amount", amount.to_string()))
        }

        ExecuteMsg::UpdateChecker { milestone_checker } => {
            let admin = ADMIN.load(deps.storage)?;
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            MILESTONE_CHECKER.save(
                deps.storage,
                &deps.api.addr_validate(&milestone_checker)?,
            )?;
            Ok(Response::new()
                .add_attribute("action", "update_checker")
                .add_attribute("milestone_checker", milestone_checker))
        }

        ExecuteMsg::WithdrawAdmin { program_id, amount } => {
            let admin = ADMIN.load(deps.storage)?;
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            let balance = PROGRAM_BALANCES
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            if balance < amount {
                return Err(ContractError::InsufficientBalance {});
            }
            PROGRAM_BALANCES.save(deps.storage, &program_id, &(balance - amount))?;
            let send_msg: CosmosMsg = CosmosMsg::Bank(BankMsg::Send {
                to_address: admin.to_string(),
                amount:     vec![Coin { denom: "uxion".to_string(), amount: Uint128::from(amount) }],
            });
            Ok(Response::new()
                .add_message(send_msg)
                .add_attribute("action", "withdraw_admin")
                .add_attribute("amount", amount.to_string()))
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::ProgramBalance { program_id } => {
            let balance = PROGRAM_BALANCES
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            to_json_binary(&BalanceResponse { balance })
        }
        QueryMsg::TotalReleased { program_id } => {
            let total = TOTAL_RELEASED
                .may_load(deps.storage, &program_id)?
                .unwrap_or(0);
            to_json_binary(&TotalReleasedResponse { total })
        }
        QueryMsg::GrantHistory { program_id, limit } => {
            let lim = limit.unwrap_or(50) as usize;
            let grants: StdResult<Vec<_>> = GRANT_HISTORY
                .prefix(&program_id)
                .range(deps.storage, None, None, cosmwasm_std::Order::Descending)
                .take(lim)
                .map(|r| Ok(r?.1))
                .collect();
            to_json_binary(&GrantHistoryResponse { grants: grants? })
        }
    }
}
