#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str    = "vite:issuer-registry";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let admin = deps.api.addr_validate(&msg.admin)?;
    ADMIN.save(deps.storage, &admin)?;
    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", admin))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    match msg {
        ExecuteMsg::CredentialWorker { worker_addr, clinic_id, clinic_name } => {
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            let record = WorkerRecord {
                clinic_id:    clinic_id.clone(),
                clinic_name:  clinic_name.clone(),
                credentialed: true,
                registered_at: env.block.time.seconds(),
            };
            WORKERS.save(deps.storage, &worker_addr, &record)?;
            Ok(Response::new()
                .add_attribute("action", "credential_worker")
                .add_attribute("worker", worker_addr)
                .add_attribute("clinic", clinic_id))
        }
        ExecuteMsg::RevokeWorker { worker_addr } => {
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            WORKERS.update(deps.storage, &worker_addr, |r| -> StdResult<_> {
                let mut rec = r.unwrap_or(WorkerRecord {
                    clinic_id:    String::new(),
                    clinic_name:  String::new(),
                    credentialed: false,
                    registered_at: 0,
                });
                rec.credentialed = false;
                Ok(rec)
            })?;
            Ok(Response::new()
                .add_attribute("action", "revoke_worker")
                .add_attribute("worker", worker_addr))
        }
        ExecuteMsg::UpdateAdmin { new_admin } => {
            if info.sender != admin {
                return Err(ContractError::Unauthorized {});
            }
            let new = deps.api.addr_validate(&new_admin)?;
            ADMIN.save(deps.storage, &new)?;
            Ok(Response::new()
                .add_attribute("action", "update_admin")
                .add_attribute("new_admin", new))
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::IsCredentialed { address } => {
            let record = WORKERS.may_load(deps.storage, &address)?;
            to_json_binary(&IsCredentialedResponse {
                credentialed: record.map(|r| r.credentialed).unwrap_or(false),
            })
        }
        QueryMsg::WorkerInfo { address } => {
            let record = WORKERS.load(deps.storage, &address)?;
            to_json_binary(&WorkerInfoResponse {
                worker_addr:   address,
                clinic_id:     record.clinic_id,
                clinic_name:   record.clinic_name,
                credentialed:  record.credentialed,
                registered_at: record.registered_at,
            })
        }
        QueryMsg::AllWorkers { limit } => {
            let lim = limit.unwrap_or(50) as usize;
            let workers: StdResult<Vec<_>> = WORKERS
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .take(lim)
                .map(|r| {
                    let (addr, rec) = r?;
                    Ok(WorkerInfoResponse {
                        worker_addr:   addr,
                        clinic_id:     rec.clinic_id,
                        clinic_name:   rec.clinic_name,
                        credentialed:  rec.credentialed,
                        registered_at: rec.registered_at,
                    })
                })
                .collect();
            to_json_binary(&AllWorkersResponse { workers: workers? })
        }
    }
}
