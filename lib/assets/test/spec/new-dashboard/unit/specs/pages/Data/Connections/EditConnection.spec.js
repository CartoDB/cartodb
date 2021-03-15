import Vuex from 'vuex';
import { createLocalVue, mount } from '@vue/test-utils';
import EditConnection from 'new-dashboard/pages/Data/Connections/EditConnection';

const localVue = createLocalVue();
localVue.use(Vuex);

const MYSQL = {
  id: 'ID',
  connector: 'mysql',
  name: 'MySQL',
  type: 'db-connector',
  connectionParams: {
    server: 'server',
    port: 5432,
    database: 'database',
    username: 'username',
    password: 'password'
  }
};

describe('Connections.vue', () => {
  beforeEach(() => {
  });

  describe('Connection type "DATABASE"', () => {
    it('should render edit version', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [ MYSQL ]
        }
      });
      const connectionsList = createConnections(store, 'edit-connection');

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render create version', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [ MYSQL ]
        }
      });
      const connectionsList = createConnections(store);

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Connection type "CLOUD"', () => {
    it('should render create version properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: []
        }
      });
      const connectionsList = createConnections(store, '', {
        connector: 'gdrive'
      });

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Connection type "BQ"', () => {
    it('should render create version properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: []
        }
      });
      const connectionsList = createConnections(store, '', {
        connector: 'bigquery'
      });

      expect(connectionsList).toMatchSnapshot();
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    connectors: {
      connections: null,
      projects: null,
      bqDatasets: null,
      loadingConnections: false,
      loadingProjects: true
    },
    config: {
      isFirstTimeViewingDashboard: false
    },
    user: {
      account_type: 'account_type'
    }
  };

  const storeInstance = new Vuex.Store({
    state: customStoreData || storeData
  });

  return storeInstance;
}

function createConnections (store, routeName = '', routeParams = {
  id: 'ID',
  connector: 'mysql'
}) {
  return mount(EditConnection, {
    mocks: {
      $t: key => key,
      backboneViews: {},
      $route: {
        name: routeName,
        params: routeParams
      },
      $router: {
        push: jest.fn()
      }
    },
    store,
    localVue
  });
}
