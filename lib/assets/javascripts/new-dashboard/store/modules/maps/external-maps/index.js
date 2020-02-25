import toObject from 'new-dashboard/utils/to-object';
import Filters from 'new-dashboard/core/configuration/filters';

import * as VisualizationActions from '../../../actions/external-visualizations';
import * as VisualizationMutations from '../../../mutations/visualizations';

const DEFAULT_VALUES = {
  filter: 'mine',
  order: 'updated_at',
  orderDirection: 'desc'
};

const externalMaps = {
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

    setExternalMaps (state, maps) {
      state.list = toObject(maps, 'id');
      state.metadata = {
        total_entries: maps.length,
        total_likes: 0,
        total_shared: 0,
        total_user_entries: 0
      };
      state.isFetching = false;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = {};
    },

    setFilterType: VisualizationMutations.setFilterType,
    setOrder: VisualizationMutations.setOrder(DEFAULT_VALUES),
    setPagination: VisualizationMutations.setPagination,
    setResultsPerPage: VisualizationMutations.setResultsPerPage,
  },
  actions: {
    async init (context) {
      try {
        await context.rootState.customStorage.init();
      } catch (err) {
        throw Error(`Error initializing CustomStorage client: ${err.message}`);
      }
    },
    setURLOptions: VisualizationActions.setURLOptions,
    resetFilters: VisualizationActions.resetFilters(DEFAULT_VALUES),
    fetch (context) {
      const params = {
        ...Filters[context.state.filterType],
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage
      };

      VisualizationActions.fetchVisualizations(context, params);
    }
  }
};

export default externalMaps;
