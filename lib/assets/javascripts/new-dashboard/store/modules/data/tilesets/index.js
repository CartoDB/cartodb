import * as TilesetActions from '../../../actions/tileset';
import * as TilesetMutations from '../../../mutations/tileset';

const tilesets = {
  namespaced: true,
  state: {
    tilesets: null,
    loadingTilesets: false,
    error: false
  },
  mutations: {
    setTilesets: TilesetMutations.setTilesets,
    setTilesetsError: TilesetMutations.setTilesetsError,
    setLoadingTilesets: TilesetMutations.setLoadingTilesets
  },
  actions: {
    fetchTilesetsList: TilesetActions.fetchTilesetsList,
    getTileset: TilesetActions.getTileset,
    setPrivacy: TilesetActions.setPrivacy
  }
};

export default tilesets;
