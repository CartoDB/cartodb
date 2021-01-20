import 'whatwg-fetch';

export async function getTilejson (context, { source, tileset, apiKey = context.rootState.user.api_key }) {
  const baseURL = 'https://maps-api-v2.us.carto.com';
  const url = `${baseURL}/user/carto/tilejson/tileset/${source}/${tileset}?api_key=${apiKey}`;

  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.status);
  }
  return result;
}
