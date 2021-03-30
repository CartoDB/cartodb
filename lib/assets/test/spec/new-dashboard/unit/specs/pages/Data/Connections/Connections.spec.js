import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import ConnectionsComponent from 'new-dashboard/pages/Data/Connections/Connections';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Connections.vue', () => {
  beforeEach(() => {
  });

  describe('Render', () => {
    it('should render initial state', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: []
        },
        config: {
          isFirstTimeViewingDashboard: false
        }
      });
      const connectionsList = createConnections(store);

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render one elements', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [{
            id: 'IDENTIFIER',
            name: 'CONNECTION NAME',
            connector: 'mysql',
            type: 'db-connector',
            parameters: {
              billing_project: 'BILLING_PROJECT',
              default_project: 'DEFAULT_PROJECT',
              service_account: '********'
            }
          }]
        },
        config: {
          isFirstTimeViewingDashboard: false
        }
      });
      const connectionsList = createConnections(store);

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Navigation', () => {
    it('should navigate to edit page', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [{
            id: 'IDENTIFIER',
            name: 'CONNECTION NAME',
            connector: 'bigquery',
            type: 'db-connector',
            parameters: {
              billing_project: 'BILLING_PROJECT',
              default_project: 'DEFAULT_PROJECT',
              service_account: '********'
            }
          }]
        },
        config: {
          isFirstTimeViewingDashboard: false
        }
      });
      const connectionsList = createConnections(store);
      connectionsList.find('#IDENTIFIER').trigger('click');

      expect(connectionsList.vm.$router.push).toHaveBeenCalledWith({ name: 'edit-connection', params: { id: 'IDENTIFIER' } });
    });

    it('not should navigate when connection is using OAUTH', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [{
            id: 'IDENTIFIER',
            name: 'CONNECTION NAME',
            connector: 'gdrive',
            type: 'db-connector',
            parameters: {
              billing_project: 'BILLING_PROJECT',
              default_project: 'DEFAULT_PROJECT',
              service_account: '********'
            }
          }]
        },
        config: {
          isFirstTimeViewingDashboard: false
        }
      });
      const connectionsList = createConnections(store);
      connectionsList.find('#IDENTIFIER').trigger('click');

      expect(connectionsList.vm.$router.push).not.toHaveBeenCalled();
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

function createConnections (store, propsData) {
  return shallowMount(ConnectionsComponent, {
    mocks: {
      $t: key => key,
      $router: {
        push: jest.fn()
      }
    },
    store,
    localVue,
    propsData
  });
}
