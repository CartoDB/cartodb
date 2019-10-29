import * as KuvizsActions from '../../../actions/kuvizs';
import * as KuvizsMutations from '../../../mutations/kuvizs';

const kuvizs = {
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
    setFetchingState: KuvizsMutations.setFetchingState,
    setRequestError: KuvizsMutations.setRequestError,
    setVisualizations: KuvizsMutations.setVisualizations
  },
  actions: {
    fetchVisualizations: KuvizsActions.fetchVisualizations,
    delete: KuvizsActions.deleteKuviz
  }
};

export default kuvizs;
