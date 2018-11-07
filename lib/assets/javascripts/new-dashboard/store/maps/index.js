import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';
import featuredFavoritedMaps from 'new-dashboard/store/maps/featured-favorited-maps';
import Filters from 'new-dashboard/store/maps/filters';

const client = new CartoNode.AuthenticatedClient();

const maps = {
  namespaced: true,
  modules: {
    featuredFavoritedMaps
  },
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    error: {},
    filterType: '',
    list: {},
    metadata: {},
    page: 1,
    numPages: 0,
    defaultParams: {
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
    },

    setFilterType (state, filterType = '') {
      state.filterType = filterType;
    },
    setPagination (state, page) {
      state.page = page;
      state.numPages = Math.ceil(state.metadata.total_entries / state.defaultParams.per_page);
    },
    updateMapLike (state, {mapId, liked}) {
      state.list[mapId].liked = liked;
    },
    updateMapNumberLikes (state, {mapId, likes}) {
      state.list[mapId].likes = likes;
    }
  },
  actions: {
    fetchMaps (context) {
      context.commit('setFetchingState');

      const params = {
        ...context.state.defaultParams,
        page: context.state.page
      };

      if (context.state.filterType) {
        Object.assign(params, Filters[context.state.filterType]);
      }

      client.getVisualization('',
        params,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }
          context.commit('setMaps', data);
          context.commit('setPagination', context.state.page);
        }
      );
    },
    goToPage (context, page) {
      context.commit('setPagination', page);
      context.dispatch('fetchMaps');
    },
    filterLockedMaps (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'locked');
      context.dispatch('fetchMaps');
    },
    filterSharedMaps (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'shared');
      context.dispatch('fetchMaps');
    },
    filterFavoritedMaps (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'favorited');
      context.dispatch('fetchMaps');
    },
    resetFilters (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', '');
      context.dispatch('fetchMaps');
    },
    likeMap (context, map) {
      const currentLikeStatus = map.liked;
      context.commit('updateMapLike', { mapId: map.id, liked: true });
      client.like(map.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateMapLike', { mapId: map.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateMapNumberLikes', { mapId: map.id, likes: data.likes });
        }
      );
    },
    deleteMapLike (context, map) {
      const currentLikeStatus = map.liked;
      context.commit('updateMapLike', { mapId: map.id, liked: false });
      client.deleteLike(map.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateMapLike', { mapId: map.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateMapNumberLikes', { mapId: map.id, likes: data.likes });
        }
      );
    }
  }
};

export default maps;
