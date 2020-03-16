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
    customStorageInitialized: false,
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

    setCustomStorageStatus (state, isInitialized) {
      state.customStorageInitialized = isInitialized;
    },

    setFilterType: VisualizationMutations.setFilterType,
    setOrder: VisualizationMutations.setOrder(DEFAULT_VALUES),
    setPagination: VisualizationMutations.setPagination,
    setResultsPerPage: VisualizationMutations.setResultsPerPage
  },
  actions: {
    init (context) {
      return new Promise((resolve, reject) => {
        context.rootState.customStorage.isInitialized()
          .then((isInitialized) => {
            context.commit('setCustomStorageStatus', isInitialized);
            resolve();
          })
          .catch((err) => {
            reject(`Error initializing CustomStorage client: ${err.message}`);
          });
      });
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
    },
    delete: VisualizationActions.deleteVisualizations
  }
};

export default externalMaps;
