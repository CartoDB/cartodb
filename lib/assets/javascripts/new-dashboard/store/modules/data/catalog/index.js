import * as CatalogActions from '../../../actions/catalog';
import * as CatalogMutations from '../../../mutations/catalog';

const DEFAULT_VALUES = {
  order: '',
  orderDirection: ''
};

const catalog = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: [],
    list: [],
    categories: [],
    countries: [],
    page: 1,
    numPages: 1,
    resultsPerPage: 12,
    order: DEFAULT_VALUES.order,
    orderDirection: DEFAULT_VALUES.orderDirection
  },
  computed: {},
  getters: {},
  mutations: {
    setDatasets: CatalogMutations.setDatasets,
    setCategories: CatalogMutations.setCategories,
    setCountries: CatalogMutations.setCountries,
    setFetchingState: CatalogMutations.setFetchingState,
    setRequestError: CatalogMutations.setRequestError,
    setPagination: CatalogMutations.setPagination,
    setResultsPerPage: CatalogMutations.setResultsPerPage,
    setOrder: CatalogMutations.setOrder(DEFAULT_VALUES),
    orderDatasets: CatalogMutations.orderDatasets
  },
  actions: {
    setURLOptions: CatalogActions.setURLOptions,
    order: CatalogActions.order,
    fetchCountries: CatalogActions.fetchCountries,
    fetchDatasets: CatalogActions.fetchDatasets,
    clearList: CatalogActions.clearList,
    fetchCategories: CatalogActions.fetchCategories,
    requestDataset: CatalogActions.requestDataset
  }
};

export default catalog;
