import {
  xionConfig,
  XION_ENV_NAME_BY_FIELD,
  SYNC_OPTIONAL_XION_FIELDS,
  SYNC_REQUIRED_XION_FIELDS,
} from './config';

export interface XionConfigStatus {
  configReady: boolean;
  missingVars: string[];
  missingOptionalVars: string[];
}

export function getXionConfigStatus(): XionConfigStatus {
  const missingVars = SYNC_REQUIRED_XION_FIELDS
    .filter((key) => !xionConfig[key])
    .map((key) => XION_ENV_NAME_BY_FIELD[key as keyof typeof XION_ENV_NAME_BY_FIELD] ?? String(key));

  const missingOptionalVars = SYNC_OPTIONAL_XION_FIELDS
    .filter((key) => !xionConfig[key])
    .map((key) => XION_ENV_NAME_BY_FIELD[key as keyof typeof XION_ENV_NAME_BY_FIELD] ?? String(key));

  return {
    configReady: missingVars.length === 0,
    missingVars,
    missingOptionalVars,
  };
}
