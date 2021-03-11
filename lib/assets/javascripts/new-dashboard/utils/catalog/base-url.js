export function getBaseURL (state) {
  if (state.config) {
    const username = state.config.user_name;
    const host = state.config.account_host;
    return `http://${username}.localhost.lan/api/v4`; // TODO: revert this change
  } else {
    return 'https://public.carto.com/api/v4';
  }
}
