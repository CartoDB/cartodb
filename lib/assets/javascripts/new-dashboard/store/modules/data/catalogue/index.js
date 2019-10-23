import * as CatalogueActions from '../../../actions/catalogue';
import * as CatalogueMutations from '../../../mutations/catalogue';

const DEFAULT_VALUES = {
  order: '',
  orderDirection: ''
};

const catalogue = {
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
    setDatasets: CatalogueMutations.setDatasets,
    setCategories: CatalogueMutations.setCategories,
    setCountries: CatalogueMutations.setCountries,
    setFetchingState: CatalogueMutations.setFetchingState,
    setRequestError: CatalogueMutations.setRequestError,
    setPagination: CatalogueMutations.setPagination,
    setResultsPerPage: CatalogueMutations.setResultsPerPage,
    setOrder: CatalogueMutations.setOrder(DEFAULT_VALUES),
    orderDatasets: CatalogueMutations.orderDatasets
  },
  actions: {
    setURLOptions: CatalogueActions.setURLOptions,
    order: CatalogueActions.order,
    fetchCountries: CatalogueActions.fetchCountries,
    fetchDatasets: CatalogueActions.fetchDatasets,
    clearList: CatalogueActions.clearList,
    fetchCategories: CatalogueActions.fetchCategories,
    requestDataset: CatalogueActions.requestDataset
  }
};

export default catalogue;
