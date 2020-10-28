export function getBaseURL (state) {
  if (state.config) {
    const username = state.config.user_name;
    const host = state.config.account_host;
    return `https://${username}.${host}/api/v4`;
  } else {
    return 'https://public.carto.com/api/v4/';
  }
}
