import * as CatalogActions from '../../../actions/catalog';
import * as CatalogMutations from '../../../mutations/catalog';

const catalog = {
  namespaced: true,
  state: {
    isFetching: false,
    hasError: false,
    datasetsList: [],
    datasetsListCount: 0,
    dataset: {},
    keyVariables: {},
    requestError: null,
    variables: [],
    filtersAvailable: {},
    filter: {
      searchText: '',
      limit: process.env.VUE_APP_PAGE_SIZE || 10,
      page: 0,
      categories: {}
    },
    subscriptionsList: [],
    currentSubscription: null,
    currentAccessPlatform: null,
    interestedSubscriptions: localStorage.getItem('interestedSubscriptions') ? localStorage.getItem('interestedSubscriptions').split(',') : []
  },
  computed: {},
  mutations: {
    setCurrentAccessPlatform: CatalogMutations.setCurrentAccessPlatform,
    setCurrentSubscription: CatalogMutations.setCurrentSubscription,
    setFetchingState: CatalogMutations.setFetchingState,
    setDatasetsList: CatalogMutations.setDatasetsList,
    setDataset: CatalogMutations.setDataset,
    setKeyVariables: CatalogMutations.setKeyVariables,
    setVariables: CatalogMutations.setVariables,
    setAvailableFilters: CatalogMutations.setAvailableFilters,
    setFilter: CatalogMutations.setFilter,
    removeFilter: CatalogMutations.removeFilter,
    setSearchText: CatalogMutations.setSearchText,
    setPage: CatalogMutations.setPage,
    setDatasetsListCount: CatalogMutations.setDatasetsListCount,
    resetTagFilters: CatalogMutations.resetTagFilters,
    resetDatasetsList: CatalogMutations.resetDatasetsList,
    resetDataset: CatalogMutations.resetDataset,
    setSubscriptionsList: CatalogMutations.setSubscriptionsList,
    setSubscriptionInfo: CatalogMutations.setSubscriptionInfo,
    setRequestError: CatalogMutations.setRequestError,
    resetSubscriptionsList: CatalogMutations.resetSubscriptionsList,
    addInterestedSubscriptions: CatalogMutations.addInterestedSubscriptions
  },
  actions: {
    initFilter: CatalogActions.initFilter,
    fetchDatasetsList: CatalogActions.fetchDatasetsList,
    fetchDataset: CatalogActions.fetchDataset,
    fetchKeyVariables: CatalogActions.fetchKeyVariables,
    fetchVariables: CatalogActions.fetchVariables,
    setSearchText: CatalogActions.setSearchText,
    setPage: CatalogActions.setPage,
    clearTagFilters: CatalogActions.clearTagFilters,
    fetchSubscriptionsList: CatalogActions.fetchSubscriptionsList,
    fetchSubscriptionsDetailsList: CatalogActions.fetchSubscriptionsDetailsList,
    performSubscribe: CatalogActions.performSubscribe,
    performUnsubscribe: CatalogActions.performUnsubscribe,
    performSubscriptionSync: CatalogActions.performSubscriptionSync,
    performSubscriptionUnsync: CatalogActions.performSubscriptionUnsync,
    connectSubscriptionSample: CatalogActions.connectSubscriptionSample,
    downloadNotebook: CatalogActions.downloadNotebook,
    requestDataset: CatalogActions.requestDataset,
    requestExtendedLicense: CatalogActions.requestExtendedLicense,
    requestAccess: CatalogActions.requestAccess,
    requestAccessHubspot: CatalogActions.requestAccessHubspot,
    sendAccessAttemptMetrics: CatalogActions.sendAccessAttemptMetrics,
    sendRequestExtendedMetrics: CatalogActions.sendRequestExtendedMetrics,
    sendRequestAccessMetrics: CatalogActions.sendRequestAccessMetrics

  },
  getters: {
    getSubscriptionByDataset: state => datasetId => {
      return state.subscriptionsList
        ? state.subscriptionsList.find(elem => elem.id === datasetId)
        : undefined;
    }
  }
};

export default catalog;
