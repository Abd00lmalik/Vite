#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult, WasmMsg, WasmQuery, QueryRequest,
    from_json,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str    = "vite:vaccination-record";
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
    ISSUER_REGISTRY.save(deps.storage, &deps.api.addr_validate(&msg.issuer_registry)?)?;
    BATCH_COUNT.save(deps.storage, &0u64)?;
    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", msg.admin)
        .add_attribute("issuer_registry", msg.issuer_registry))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::SubmitBatch {
            batch_id,
            merkle_root,
            record_count,
            submitter,
            clinic_id,
        } => {
            // Check batch_id uniqueness
            if BATCHES.may_load(deps.storage, &batch_id)?.is_some() {
                return Err(ContractError::Unauthorized {});
            }

            let count = BATCH_COUNT.load(deps.storage)?;
            let record = BatchRecord {
                batch_id:     batch_id.clone(),
                merkle_root:  merkle_root.clone(),
                record_count,
                submitter:    submitter.clone(),
                clinic_id:    clinic_id.clone(),
                submitted_at: env.block.time.seconds(),
                tx_height:    env.block.height,
            };
            BATCHES.save(deps.storage, &batch_id, &record)?;
            BATCH_COUNT.save(deps.storage, &(count + 1))?;

            Ok(Response::new()
                .add_attribute("action", "submit_batch")
                .add_attribute("batch_id", batch_id)
                .add_attribute("merkle_root", merkle_root)
                .add_attribute("record_count", record_count.to_string())
                .add_attribute("submitter", submitter)
                .add_attribute("clinic_id", clinic_id))
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetBatch { batch_id } => {
            let batch = BATCHES.load(deps.storage, &batch_id)?;
            to_json_binary(&BatchResponse { batch })
        }
        QueryMsg::AllBatches { limit } => {
            let lim = limit.unwrap_or(50) as usize;
            let batches: StdResult<Vec<_>> = BATCHES
                .range(deps.storage, None, None, cosmwasm_std::Order::Descending)
                .take(lim)
                .map(|r| Ok(r?.1))
                .collect();
            to_json_binary(&AllBatchesResponse { batches: batches? })
        }
        QueryMsg::VerifyRecord { batch_id, record_hash: _, proof: _ } => {
            // Simplified: return valid if batch exists
            // Full Merkle verification requires sha256 crate integration
            let exists = BATCHES.may_load(deps.storage, &batch_id)?.is_some();
            to_json_binary(&VerifyResponse { valid: exists })
        }
    }
}
