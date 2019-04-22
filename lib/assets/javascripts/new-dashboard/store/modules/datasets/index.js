import Filters from 'new-dashboard/core/configuration/filters';

import * as SharedActions from '../../actions/shared';
import * as SharedMutations from '../../mutations/shared';
import * as VisualizationActions from '../../actions/visualizations';
import * as VisualizationMutations from '../../mutations/visualizations';

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
    resultsPerPage: 1
  },
  mutations: {
    setFetchingState: SharedMutations.setFetchingState,
    setFilterType: VisualizationMutations.setFilterType,
    setOrder: VisualizationMutations.setOrder(DEFAULT_VALUES),
    setPagination: SharedMutations.setPagination,
    setResultsPerPage: SharedMutations.setResultsPerPage,
    setRequestError: SharedMutations.setRequestError,
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
    setResultsPerPage: SharedActions.setResultsPerPage,
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
        with_dependent_visualizations: 10
      };

      VisualizationActions.fetchVisualizations(context, params);
    }
  }
};

export default datasets;
