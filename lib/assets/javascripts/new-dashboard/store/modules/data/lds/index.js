import * as LDSActions from '../../../actions/lds';
import * as LDSMutations from '../../../mutations/lds';

const DEFAULT_VALUES = {
  // filter: 'mine',
  order: '',
  orderDirection: ''
};

const lds = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: [],
    list: [],
    page: 1,
    numPages: 1,
    resultsPerPage: 12,
    order: DEFAULT_VALUES.order,
    orderDirection: DEFAULT_VALUES.orderDirection
  },
  computed: {},
  getters: {},
  mutations: {
    setDatasets: LDSMutations.setDatasets,
    setFetchingState: LDSMutations.setFetchingState,
    setRequestError: LDSMutations.setRequestError,
    setPagination: LDSMutations.setPagination,
    setResultsPerPage: LDSMutations.setResultsPerPage,
    setOrder: LDSMutations.setOrder(DEFAULT_VALUES),
    orderDatasets: LDSMutations.orderDatasets
  },
  actions: {
    setURLOptions: LDSActions.setURLOptions,
    order: LDSActions.order,
    fetch (context) {
      const params = {
        page: context.state.page
      };

      LDSActions.fetchLDS(context, params);
    }
  }
};

export default lds;
