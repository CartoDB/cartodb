import * as TilesetActions from '../../../actions/tileset';
import * as TilesetMutations from '../../../mutations/tileset';

const tilesets = {
  namespaced: true,
  state: {
    tilesets: null,
    loadingTilesets: false
  },
  mutations: {
    setTilesets: TilesetMutations.setTilesets,
    setLoadingTilesets: TilesetMutations.setLoadingTilesets
  },
  actions: {
    fetchTilesetsList: TilesetActions.fetchTilesetsList,
    getTileset: TilesetActions.getTileset,
    setPrivacy: TilesetActions.setPrivacy
  }
};

export default tilesets;
