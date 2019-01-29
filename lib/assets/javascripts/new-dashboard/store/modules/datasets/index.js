import CartoNode from 'carto-node';
import toObject from 'new-dashboard/utils/to-object';
import Filters, { defaultParams as filtersDefaultParams } from 'new-dashboard/core/filters';

import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

const client = new CartoNode.AuthenticatedClient();

const DEFAULT_VALUES = {
  filter: 'mine',
  order: 'updated_at',
  orderDirection: 'desc'
};

const datasets = {
  namespaced: true,
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
    resultsPerPage: 1
  },
  mutations: {
    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
    },

    setDatasets (state, datasets) {
      state.list = toObject(datasets.visualizations, 'id');
      state.metadata = {
        total_entries: datasets.total_entries,
        total_likes: datasets.total_likes,
        total_shared: datasets.total_shared,
        total_locked: datasets.total_locked,
        total_user_entries: datasets.total_user_entries
      };

      state.isFetching = false;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = {};
    },

    setPagination (state, page = 1) {
      state.page = page;
      state.numPages = Math.ceil(state.metadata.total_entries / filtersDefaultParams.per_page) || 1;
    },

    setFilterType (state, filterType = 'mine') {
      state.filterType = filterType;
    },

    setOrder (state, orderOptions) {
      state.order = orderOptions.order || DEFAULT_VALUES.order;
      state.orderDirection = orderOptions.direction || DEFAULT_VALUES.orderDirection;
    },

    setResultsPerPage (state, resultsPerPage) {
      state.resultsPerPage = resultsPerPage;
    },

    like: VisualizationMutations.updateLike,
    updateNumberLikes: VisualizationMutations.updateNumberLikes
  },
  actions: {
    fetchDatasets (context) {
      context.commit('setFetchingState');

      const params = {
        ...Filters[context.state.filterType],
        types: 'table',
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage,
        with_dependent_visualizations: 10
      };

      client.getVisualization('',
        params,
        function (err, _, data) {
          if (err) {
            context.commit('setRequestError', err);
            return;
          }
          context.commit('setDatasets', data);
          context.commit('setPagination', context.state.page);
        });
    },

    filterDatasets (context, filter) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', filter);
      context.dispatch('fetchDatasets');
    },

    orderDatasets (context, orderOptions) {
      context.commit('setPagination', 1);
      context.commit('setOrder', orderOptions);
      context.dispatch('fetchDatasets');
    },

    like: VisualizationActions.like,
    deleteLike: VisualizationActions.deleteLike,
    updateVisualization: VisualizationActions.updateVisualization,

    setResultsPerPage (context, perPage) {
      context.commit('setResultsPerPage', perPage);
    },

    setURLOptions (context, options) {
      context.commit('setPagination', options.page);
      context.commit('setFilterType', options.filter);
      context.commit('setOrder', { order: options.order, direction: options.order_direction });
      context.dispatch('fetchDatasets');
    },

    resetFilters (context) {
      context.commit('setPagination', 1);
      context.commit('setFilterType', 'mine');
      context.commit('setResultsPerPage', 12);
      context.commit('setOrder', { order: DEFAULT_VALUES.order, direction: DEFAULT_VALUES.orderDirection });
    }
  }
};

export default datasets;
