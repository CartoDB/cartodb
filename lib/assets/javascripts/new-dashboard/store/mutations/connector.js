export function setLoadingConnections (state) {
  state.loadingConnections = true;
}
export function setLoadingDatasets (state) {
  state.loadingDatasets = true;
}
export function setLoadingProjects (state) {
  state.loadingProjects = true;
}
export function setConnections (state, data) {
  state.connections = data.filter(c => !(c.connector === 'bigquery' && !c.complete));
  state.loadingConnections = false;
}
export function setProjects (state, data) {
  state.projects = data;
  state.loadingProjects = false;
}
export function setBQDatasets (state, data) {
  state.bqDatasets = data;
  state.loadingDatasets = false;
}
