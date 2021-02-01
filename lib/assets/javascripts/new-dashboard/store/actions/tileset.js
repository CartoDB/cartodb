import 'whatwg-fetch';
import { getBaseURL } from 'new-dashboard/utils/base-url';

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

export async function setPrivacy (context, { source, tileset_id, connection_id, project_id, dataset_id, privacy }) {
  if (!context.rootState.user) {
    return;
  }
  const baseURL = getBaseURL(context.rootState);
  const apiKey = context.rootState.user.api_key;
  const action = privacy === 'public' ? 'publish' : 'unpublish';
  const url = `${baseURL}/${source}/tilesets/${action}?api_key=${apiKey}&connection_id=${connection_id}&project_id=${project_id}&dataset_id=${dataset_id}&tileset_id=${tileset_id}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.status);
  }
}
