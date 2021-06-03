export function getBaseURL (state) {
  if (state.config) {
    const username = state.config.user_name;
    const host = state.config.account_host;
    return `https://${username}.${host}/api/v4`;
  } else if (window.location.hostname.includes('staging')) {
    return `https://public.carto-staging.com/api/v4`;
  } else {
    return 'https://public.carto.com/api/v4';
  }
}

export function getMetricsBaseURL (state) {
  return `${state.config.base_url}/api/v3/metrics`;
}
