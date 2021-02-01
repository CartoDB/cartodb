import * as ConnectorActions from '../../../actions/connector';
import * as ConnectorMutations from '../../../mutations/connector';
import * as ConnectorGetter from '../../../getters/connector';

const datasets = {
  namespaced: true,
  state: {
    connections: null,
    projects: null,
    bqDatasets: null,
    loadingConnections: false
  },
  getters: {
    getBigqueryConnection: ConnectorGetter.getBigqueryConnection,
    hasBigqueryConnection: ConnectorGetter.hasBigqueryConnection
  },
  mutations: {
    setConnections: ConnectorMutations.setConnections,
    setLoadingConnections: ConnectorMutations.setLoadingConnections,
    setLoadingDatasets: ConnectorMutations.setLoadingDatasets,
    setProjects: ConnectorMutations.setProjects,
    setBQDatasets: ConnectorMutations.setBQDatasets
  },
  actions: {
    requestConnector: ConnectorActions.requestConnector,
    deleteConnection: ConnectorActions.deleteConnection,
    editExistingConnection: ConnectorActions.editExistingConnection,
    createNewConnection: ConnectorActions.createNewConnection,
    createNewOauthConnection: ConnectorActions.createNewOauthConnection,
    checkOauthConnection: ConnectorActions.checkOauthConnection,
    fetchOAuthFileList: ConnectorActions.fetchOAuthFileList,
    connectionDryrun: ConnectorActions.connectionDryrun,
    fetchConnectionById: ConnectorActions.fetchConnectionById,
    fetchConnectionsList: ConnectorActions.fetchConnectionsList,
    checkServiceAccount: ConnectorActions.checkServiceAccount,
    createNewBQConnection: ConnectorActions.createNewBQConnection,
    fetchBQProjectsList: ConnectorActions.fetchBQProjectsList,
    fetchBQDatasetsList: ConnectorActions.fetchBQDatasetsList

  }
};

export default datasets;
