export function setLoadingTilesets (state) {
  state.loadingTilesets = true;
}
export function setTilesets (state, data) {
  state.tilesets = data;
  state.loadingTilesets = false;
}
