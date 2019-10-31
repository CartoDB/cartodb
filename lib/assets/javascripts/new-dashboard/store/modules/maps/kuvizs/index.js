import Filters from 'new-dashboard/core/configuration/filters';
import * as VisualizationActions from '../../../actions/visualizations';
import * as VisualizationMutations from '../../../mutations/visualizations';

const DEFAULT_VALUES = {
  filter: 'mine',
  order: 'favorited,updated_at',
  orderDirection: 'desc,desc'
};

const kuvizs = {
  namespaced: true,
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    order: DEFAULT_VALUES.order,
    orderDirection: DEFAULT_VALUES.orderDirection,
    error: {},
    list: {},
    metadata: {},
    page: 1,
    numPages: 1,
    resultsPerPage: 12
  },
  getters: {},
  mutations: {
    setFetchingState: VisualizationMutations.setFetchingState,
    setFilterType: VisualizationMutations.setFilterType,
    setOrder: VisualizationMutations.setOrder(DEFAULT_VALUES),
    setPagination: VisualizationMutations.setPagination,
    setResultsPerPage: VisualizationMutations.setResultsPerPage,
    setRequestError: VisualizationMutations.setRequestError,
    setVisualizations: VisualizationMutations.setVisualizations
  },
  actions: {
    filter: VisualizationActions.filter,
    order: VisualizationActions.order,
    resetFilters: VisualizationActions.resetFilters(DEFAULT_VALUES),
    setResultsPerPage: VisualizationActions.setResultsPerPage,
    setURLOptions: VisualizationActions.setURLOptions,
    fetch (context) {
      const params = {
        ...Filters[context.state.filterType],
        types: 'kuviz',
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage
      };

      VisualizationActions.fetchVisualizations(context, params);
    }
  }
};

export default kuvizs;
