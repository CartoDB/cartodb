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
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    context.commit('setTilesets', []);
    throw new Error(JSON.stringify({
      status: response.status,
      message: data.errors
    }));
  }
  context.commit('setTilesets', data || []);
}

export async function getTileset (context, { source, tileset_id, connection_id, project_id }) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const url = `${baseURL}/${source}/tilesets/${tileset_id}?api_key=${apiKey}&connection_id=${connection_id}&project_id=${project_id}`;

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`ERROR: ${error}`);
  }
}

export async function setPrivacy (context, { source, table, connection_id, project_id, dataset_id, privacy }) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const action = privacy === 'public' ? 'publish' : 'unpublish';
  const url = `${baseURL}/${source}/tilesets/${action}?api_key=${apiKey}&connection_id=${connection_id}&project_id=${project_id}&dataset_id=${dataset_id}&tileset_id=${table}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        status: response.status,
        errors: (await response.json()).errors
      })
    );
  }
}
