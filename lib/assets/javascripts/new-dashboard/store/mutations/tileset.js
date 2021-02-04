export function setLoadingTilesets (state) {
  state.loadingTilesets = true;
  state.error = false;
}
export function setTilesetsError (state) {
  state.error = true;
}
export function setTilesets (state, data) {
  state.tilesets = data;
  state.loadingTilesets = false;
}
