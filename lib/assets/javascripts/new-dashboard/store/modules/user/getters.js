export function canCreateDatasets (state) {
  if (!state.remaining_byte_quota || state.remaining_byte_quota <= 0) {
    return false;
  }

  return hasCreateDatasetsFeature(state);
}

export function hasCreateDatasetsFeature (state) {
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
  return getPublicMapsCount(state) >= getPublicMapsQuota(state);
}

export function getDatasetsCount (state) {
  return state.table_count;
}

export function getDatasetsQuota (state) {
  return state.table_quota;
}

export function isOutOfDatasetsQuota (state) {
  return getDatasetsCount(state) >= getDatasetsQuota(state);
}
