// lib/property/index.js

// Export dari constants.js
export * from './constants';

// Export dari config.js
export {
  PROPERTY_TYPE_CONFIG,
  CERTIFICATE_REQUIRED_TYPES,
  getPropertyConfig,
  getAutoBuildingType,
  getBuildingTypeDisplay,
  getBuildingTypeLabel,
  getBuildingTypePlaceholder,
  getRelevantDetailFields,
} from './config';

// Export dari formatters.js
export {
  formatThousands,
  formatCompact,
  formatViewCount,
  formatFullRupiah,
  formatDateTime,
} from './formatters';

export { getPropertyCardMetaItems } from './cardMeta';
export { FIELD_WEIGHTS, getFieldWeight } from './fieldWeights';

// Export dari transformers.js
export {
  validatePropertyForm,
  buildJsonPayload,
  buildFormDataPayload,
} from './transformers';
