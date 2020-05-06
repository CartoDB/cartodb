import toObject from 'new-dashboard/utils/to-object';
import { defaultParams as filtersDefaultParams } from 'new-dashboard/core/configuration/filters';

const featuredFavoritedMaps = {
  namespaced: true,
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    error: {},
    list: {},
    metadata: {},
    order: 'updated_at',
    params: {
      per_page: 2,
      only_liked: true
    }
  },
  getters: {},
  mutations: {
    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
    },

    setFeaturedFavoritedMaps (state, maps) {
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
      const favoritedParams = {
        ...filtersDefaultParams,
        ...context.state.params,
        order: context.state.order
      };

      context.commit('setFetchingState');

      context.rootState.client.getVisualization('',
        favoritedParams,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }

          context.commit('setFeaturedFavoritedMaps', data);
        }
      );
    }
  }
};

export default featuredFavoritedMaps;
