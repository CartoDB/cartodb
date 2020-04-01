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
    // TODO: Mirar nombres
    setFetchingState (state) {
      state.isFetching = true;
    },
    setIPs: DirectDBConnectionMutations.setIPs
  },
  actions: {
    // TODO: Mirar nombres
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
    // TODO: Mirar nombres
    setFetchingState (state) {
      state.isFetching = true;
    },
    setCertificates: DirectDBConnectionMutations.setCertificates
  },
  actions: {
    // TODO: Mirar nombres
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
