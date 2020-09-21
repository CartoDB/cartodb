export function canCreateDatasets (state) {
  if (!state.remaining_byte_quota || state.remaining_byte_quota <= 0 || isOutOfDatasetsQuota(state)) {
    return false;
  }

  return hasCreateDatasetsFeature(state);
}

export function hasCreateDatasetsFeature (state) {
  return isBuilder(state);
}

export function canCreateMaps (state) {
  if (isOutOfPrivateMapsQuota(state)) {
    return false;
  }

  return isBuilder(state);
}

export function isBuilder (state) {
  return !isViewer(state);
}

export function isViewer (state) {
  return state.viewer === true;
}

export function hasEngine (state) {
  return state.actions.engine_enabled === true;
}

export function isMobileSDKEnabled (state) {
  return state.actions.mobile_sdk_enabled;
}

export function isNotificationVisible (state) {
  return state.notification && state.showNotification;
}

export function userNotification (state) {
  return state.notification ? state.notification : null;
}

export function getPublicMapsCount (state) {
  return (state.link_privacy_map_count + state.password_privacy_map_count + state.public_privacy_map_count) || 0;
}

export function getPublicMapsQuota (state) {
  return state.public_map_quota;
}

export function isOutOfPublicMapsQuota (state) {
  return getPublicMapsQuota(state) && getPublicMapsCount(state) >= getPublicMapsQuota(state);
}

export function getPrivateMapsCount (state) {
  return state.private_privacy_map_count || 0;
}

export function getPrivateMapsQuota (state) {
  return state.private_map_quota;
}

export function isOutOfPrivateMapsQuota (state) {
  return getPrivateMapsQuota(state) && getPrivateMapsCount(state) >= getPrivateMapsQuota(state);
}

export function getDatasetsCount (state) {
  return state.table_count;
}

export function getDatasetsQuota (state) {
  return state.table_quota;
}

export function isOutOfDatasetsQuota (state) {
  return getDatasetsQuota(state) && getDatasetsCount(state) >= getDatasetsQuota(state);
}

export function isOrganizationUser (state) {
  return Boolean(state.organization);
}
