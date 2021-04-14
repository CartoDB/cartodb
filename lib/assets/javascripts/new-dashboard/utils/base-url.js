export function getBaseURL (state, apiVersion = 'v4') {
  if (state.config) {
    // const username = state.config.user_name;
    // const host = state.config.account_host;
    // return `https://${username}.${host}/api/${apiVersion}`;
    return `${state.config.base_url}/api/${apiVersion}`;
  } else {
    return `https://public.carto.com/api/${apiVersion}`;
  }
}
