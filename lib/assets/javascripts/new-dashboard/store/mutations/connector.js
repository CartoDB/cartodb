export function setLoadingConnections (state) {
  state.loadingConnections = true;
}
export function setConnections (state, data) {
  state.connections = data;
  state.loadingConnections = false;
}
