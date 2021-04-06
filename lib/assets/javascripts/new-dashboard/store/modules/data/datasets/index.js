import Filters from 'new-dashboard/core/configuration/filters';

import * as VisualizationActions from '../../../actions/visualizations';
import * as VisualizationMutations from '../../../mutations/visualizations';

const DEFAULT_VALUES = {
  filter: 'mine',
  order: 'favorited,updated_at',
  orderDirection: 'desc,desc'
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
    resultsPerPage: 1,
    queryFilter: null
  },
  mutations: {
    setFetchingState: VisualizationMutations.setFetchingState,
    setFilterType: VisualizationMutations.setFilterType,
    setOrder: VisualizationMutations.setOrder(DEFAULT_VALUES),
    setPagination: VisualizationMutations.setPagination,
    setResultsPerPage: VisualizationMutations.setResultsPerPage,
    setQueryFilter: VisualizationMutations.setQueryFilter,
    setRequestError: VisualizationMutations.setRequestError,
    setVisualizations: VisualizationMutations.setVisualizations,
    updateNumberLikes: VisualizationMutations.updateNumberLikes,
    updateVisualization: VisualizationMutations.updateVisualization
  },
  actions: {
    deleteLike: VisualizationActions.deleteLike,
    filter: VisualizationActions.filter,
    like: VisualizationActions.like,
    order: VisualizationActions.order,
    resetFilters: VisualizationActions.resetFilters(DEFAULT_VALUES),
    setResultsPerPage: VisualizationActions.setResultsPerPage,
    setURLOptions: VisualizationActions.setURLOptions,
    updateVisualization: VisualizationActions.updateVisualization,

    fetch (context) {
      const params = {
        ...Filters[context.state.filterType],
        types: 'table',
        page: context.state.page,
        order: context.state.order,
        order_direction: context.state.orderDirection,
        per_page: context.state.resultsPerPage,
        with_dependent_visualizations: 10,
        load_do_totals: true,
        ...(context.state.queryFilter ? { q: context.state.queryFilter } : {})
      };

      VisualizationActions.fetchVisualizations(context, params);
    }
  }
};

export default datasets;
