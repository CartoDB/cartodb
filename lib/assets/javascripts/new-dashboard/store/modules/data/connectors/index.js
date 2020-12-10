import * as ConnectorActions from '../../../actions/connector';
import * as ConnectorMutations from '../../../mutations/connector';

const datasets = {
  namespaced: true,
  state: {
    connections: null,
    loadingConnections: false
  },
  mutations: {
    setConnections: ConnectorMutations.setConnections,
    setLoadingConnections: ConnectorMutations.setLoadingConnections
  },
  actions: {
    requestConnector: ConnectorActions.requestConnector,
    deleteConnection: ConnectorActions.deleteConnection,
    createNewConnection: ConnectorActions.createNewConnection,
    fetchConnectionsList: ConnectorActions.fetchConnectionsList
  }
};

export default datasets;
