export function getBaseURL (state) {
  // https://public.carto.com/api/v4/
  const username = state.config.user_name;
  const host = state.config.account_host;
  return `https://${username}.${host}/api/v4`;
}
