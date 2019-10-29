import * as KuvizActions from '../../../actions/kuviz';
import * as KuvizMutations from '../../../mutations/kuviz';

const kuviz = {
  namespaced: true,
  state: {
    isFetching: false,
    isFiltered: false,
    isErrored: false,
    error: {},
    list: {},
    metadata: {},
    page: 1,
    numPages: 1,
    resultsPerPage: 12
  },
  getters: {},
  mutations: {
    setFetchingState: KuvizMutations.setFetchingState,
    setPagination: KuvizMutations.setPagination,
    setResultsPerPage: KuvizMutations.setResultsPerPage,
    setRequestError: KuvizMutations.setRequestError,
    setVisualizations: KuvizMutations.setVisualizations,
    updateVisualization: KuvizMutations.updateVisualization
  },
  actions: {
    // setResultsPerPage: KuvizActions.setResultsPerPage,
    updateVisualization: KuvizActions.updateVisualization,
    fetchVisualizations: KuvizActions.fetchVisualizations
  }
};

export default kuviz;
