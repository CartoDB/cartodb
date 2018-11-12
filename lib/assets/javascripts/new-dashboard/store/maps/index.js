import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';
import featuredFavoritedMaps from 'new-dashboard/store/maps/featured-favorited-maps';
import Filters, { defaultParams as filtersDefaultParams } from 'new-dashboard/store/maps/filters';

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
    filterType: 'mine',
    order: 'updated_at',
    list: {},
    metadata: {},
    page: 1,
    numPages: 1
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
      state.numPages = Math.ceil(state.metadata.total_entries / filtersDefaultParams.per_page) || 1;
    },

    setMapAttributes (state, {mapId, mapAttributes}) {
      Object.assign(state.list[mapId], mapAttributes);
    },

    setOrder (state, order = 'updated_at') {
      state.order = order;
    },

    setURLOptions (state, options) {
      state.page = options.page ? parseInt(options.page) : 1;
      state.filterType = options.filter || 'mine';
    },

    updateLike (state, {mapId, liked}) {
      state.list[mapId].liked = liked;
    },

    updateNumberLikes (state, {mapId, likes}) {
      state.list[mapId].likes = likes;
    }
  },
  actions: {
    fetchMaps (context) {
      context.commit('setFetchingState');

      const params = {
        ...Filters[context.state.filterType],
        types: 'derived',
        page: context.state.page,
        order: context.state.order
      };

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
    filterMaps (context, filter) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', filter);
      context.dispatch('fetchMaps');
    },
    orderMaps (context, order) {
      context.commit('setPagination', 1);
      context.commit('setOrder', order);
      context.dispatch('fetchMaps');
    },
    resetFilters (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', '');
      context.dispatch('fetchMaps');
    },
    updateMap (context, mapOptions) {
      context.commit('setMapAttributes', mapOptions);
    },
    setURLOptions (context, options) {
      context.commit('setURLOptions', options);
      context.dispatch('fetchMaps');
    },
    like (context, map) {
      const currentLikeStatus = map.liked;
      context.commit('updateLike', { mapId: map.id, liked: true });
      client.like(map.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateLike', { mapId: map.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateNumberLikes', { mapId: map.id, likes: data.likes });
        }
      );
    },
    deleteLike (context, map) {
      const currentLikeStatus = map.liked;
      context.commit('updateLike', { mapId: map.id, liked: false });
      client.deleteLike(map.id,
        function (err, _, data) {
          if (err) {
            context.commit('updateLike', { mapId: map.id, liked: currentLikeStatus });
            return;
          }
          context.commit('updateNumberLikes', { mapId: map.id, likes: data.likes });
        }
      );
    }
  }
};

export default maps;
