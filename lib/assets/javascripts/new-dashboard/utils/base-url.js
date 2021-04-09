export function getBaseURL (state, apiVersion = 'v4') {
  if (state.config) {
    return `${state.config.base_url}/api/${apiVersion}`;
  } else if (window.location.hostname === 'carto-staging.com') {
    return `https://public.carto-staging.com/api/${apiVersion}`;
  } else {
    return `https://public.carto.com/api/${apiVersion}`;
  }
}
