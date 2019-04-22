import * as SharedActions from '../../actions/shared';
import * as SharedMutations from '../../mutations/shared';
import * as TagsActions from '../../actions/tags';
import * as TagsMutations from '../../mutations/tags';

const tags = {
  state: {
    isFetching: false,
    isErrored: false,
    error: {},
    page: 1,
    numPages: 1,
    resultsPerPage: 1
  },
  mutations: {
    setFetchingState: SharedMutations.setFetchingState,
    setPagination: SharedMutations.setPagination,
    setResultsPerPage: SharedMutations.setResultsPerPage,
    setRequestError: SharedMutations.setRequestError,
    setTags: TagsMutations.setTags
  },
  actions: {
    setResultsPerPage: SharedActions.setResultsPerPage,

    fetch (context) {
      const params = {
        types: 'table,derived',
        page: context.state.page,
        per_page: context.state.resultsPerPage,
        include_shared: true
      };

      TagsActions.fetchTags(context, params);
    }
  }
};

export default tags;
