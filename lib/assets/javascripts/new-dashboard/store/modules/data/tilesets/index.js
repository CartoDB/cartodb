import * as TilesetActions from '../../../actions/tileset';

const tilesets = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    getTileset: TilesetActions.getTileset,
    setPrivacy: TilesetActions.setPrivacy
  }
};

export default tilesets;
