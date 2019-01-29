import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';
import featuredFavoritedMaps from 'new-dashboard/store/modules/maps/featured-favorited-maps';
import Filters, { defaultParams as filtersDefaultParams } from 'new-dashboard/core/filters';

import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const client = new CartoNode.AuthenticatedClient();

const DEFAULT_VALUES = {
  filter: 'mine',
  order: 'favorited,updated_at',
  orderDirection: 'desc,desc'
};

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
    filterType: DEFAULT_VALUES.filter,
    order: DEFAULT_VALUES.order,
    orderDirection: DEFAULT_VALUES.orderDirection,
    list: {},
    metadata: {},
    page: 1,
    numPages: 1,
    resultsPerPage: 12
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
        total_locked: maps.total_locked,
        total_user_entries: maps.total_user_entries
      };

      state.isFetching = false;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = {};
    },

    setFilterType (state, filterType = 'mine') {
      state.filterType = filterType;
    },

    setPagination (state, page = 1) {
      state.page = page;
      state.numPages = Math.ceil(state.metadata.total_entries / filtersDefaultParams.per_page) || 1;
    },

    setOrder (state, orderOpts) {
      state.order = orderOpts.order || DEFAULT_VALUES.order;
      state.orderDirection = orderOpts.direction || DEFAULT_VALUES.orderDirection;
    },

    setResultsPerPage (state, resultsPerPage = 12) {
      state.resultsPerPage = resultsPerPage;
    },

    updateLike: VisualizationMutations.updateLike,
    updateNumberLikes: VisualizationMutations.updateNumberLikes
  },
  actions: {
    fetchMaps (context) {
      context.commit('setFetchingState');
      const params = {
        ...Filters[context.state.filterType],
        types: 'derived',
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage
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
    orderMaps (context, orderOpts) {
      context.commit('setPagination', 1);
      context.commit('setOrder', orderOpts);
      context.dispatch('fetchMaps');
    },
    resetFilters (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'mine');
      context.commit('setResultsPerPage', 12);
      context.commit('setOrder', {order: DEFAULT_VALUES.order, orderDirection: DEFAULT_VALUES.orderDirection});
    },
    setPerPage (context, resultsPerPage) {
      context.commit('setResultsPerPage', resultsPerPage);
    },
    updateVisualization: VisualizationActions.updateVisualization,
    setURLOptions (context, options) {
      context.commit('setPagination', options.page);
      context.commit('setFilterType', options.filter);
      context.commit('setOrder', {direction: options.order_direction, order: options.order});
      context.dispatch('fetchMaps');
    },
    like: VisualizationActions.like,
    deleteLike: VisualizationActions.deleteLike
  }
};

export default maps;
