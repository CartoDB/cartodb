export function getBaseURL (state, apiVersion = 'v4') {
  if (state.config) {
    const username = state.config.user_name;
    const host = state.config.account_host;
    return `http://${username}.${host}/api/${apiVersion}`;
  } else {
    return `http://public.carto.com/api/${apiVersion}`;
  }
}
