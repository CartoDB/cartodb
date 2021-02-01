import 'whatwg-fetch';
import { getBaseURL } from 'new-dashboard/utils/base-url';

export async function fetchTilesetsList (context, { connectionId, projectId, datasetId, perPage = 10, page = 1 }) {
  if (!context.rootState.user) {
    return;
  }

  if (!datasetId) {
    context.commit('setTilesets', []);
    return;
  }

  context.commit('setLoadingTilesets');

  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/bigquery/tilesets?api_key=${apiKey}&connection_id=${connectionId}&project_id=${projectId}&dataset_id=${datasetId}&per_page=${perPage}&page=${page}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    context.commit('setTilesets', data || []);
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

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
