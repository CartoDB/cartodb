import CartoNode from 'carto-node';

const client = new CartoNode.AuthenticatedClient();

const maps = {
  namespaced: true,
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    error: {},
    filterType: '',
    filters: {},
    list: {},
    metadata: {},
    defaultParams: {
      page: 1,
      exclude_shared: false,
      per_page: 12,
      shared: 'no',
      locked: false,
      only_liked: false,
      order: 'updated_at',
      types: 'derived',
      deepInsights: false
    }
  },
  getters: {},
  mutations: {
    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
    },

    setMaps (state, maps) {
      state.list = toObject(maps.visualizations, 'id');
      state.metadata = {
        total_entries: maps.total_entries,
        total_likes: maps.total_likes,
        total_shared: maps.total_shared,
        total_user_entries: maps.total_user_entries
      };

      state.isFetching = false;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = {};
    }
  },
  actions: {
    fetchMaps (context) {
      context.commit('setFetchingState');

      client.getVisualization('',
        context.state.defaultParams,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }

          context.commit('setMaps', data);
        }
      );
    }
  }
};

const toObject = function toObject (array, property) {
  return array.reduce((finalObject, currentElement) => {
    finalObject[currentElement[property]] = currentElement;
    return finalObject;
  }, {});
};

export default maps;
