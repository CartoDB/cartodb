import * as DirectDBConnectionMutations from '../../mutations/direct-db-connection';
import * as DirectDBConnectionActions from '../../actions/direct-db-connection';

const ipStore = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: {},
    list: []
  },
  mutations: {
    setFetchingState: DirectDBConnectionMutations.setFetchingState,
    setIPs: DirectDBConnectionMutations.setIPs,
    setIPsRequestError: DirectDBConnectionMutations.setRequestError
  },
  actions: {
    fetch: DirectDBConnectionActions.fetchIPs,
    set: DirectDBConnectionActions.setIPs
  }
};

const certificatesStore = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: {},
    list: {}
  },
  mutations: {
    setFetchingState: DirectDBConnectionMutations.setFetchingState,
    setCertificates: DirectDBConnectionMutations.setCertificates,
    setCertificatesRequestError: DirectDBConnectionMutations.setRequestError
  },
  actions: {
    fetch: DirectDBConnectionActions.fetchCertificates,
    revoke: DirectDBConnectionActions.revokeCertificate
  }
};

const directDBConnection = {
  namespaced: true,
  modules: {
    ip: ipStore,
    certificates: certificatesStore
  }
};

export default directDBConnection;
