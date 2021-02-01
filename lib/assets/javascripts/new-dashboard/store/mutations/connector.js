export function setLoadingConnections (state) {
  state.loadingConnections = true;
}
export function setLoadingDatasets (state) {
  state.loadingDatasets = true;
}
export function setConnections (state, data) {
  state.connections = data;
  state.loadingConnections = false;
}
export function setProjects (state, data) {
  state.projects = data;
}
export function setBQDatasets (state, data) {
  state.bqDatasets = data;
  state.loadingDatasets = false;
}
