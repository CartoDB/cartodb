import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import ConnectionsComponent from 'new-dashboard/pages/Data/Connections/Connections';
import { connectionsState } from './state';

const localVue = createLocalVue();
localVue.use(Vuex);

fdescribe('Connections.vue', () => {
  let connectionsComponent, pushSpy;

  beforeEach(() => {
    pushSpy = jest.fn();

    connectionsComponent = shallowMount(ConnectionsComponent, {
      mocks: {
        $t: key => key,
        $store: {
          dispatch: jest.fn(),
          state: connectionsState,
          actions: {
            'connectors/fetchConnectionsList': jest.fn()
          }
        },
        $router: {
          push: pushSpy
        }
      }
    });
  });

  describe('Render', () => {
    it('should render properly', () => {
      expect(connectionsComponent).toMatchSnapshot();
    });
  });

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
    const datasetsList = createConnections(store);

    expect(datasetsList).toMatchSnapshot();
  });

  it('should render elements', () => {
    const store = createStore({
      connectors: {
        loadingConnections: false,
        connections: [{"id":"7263f052-dc4f-4540-932c-4784e43db7c4","name":"BigQuery","connector":"bigquery","type":"db-connector","parameters":{"billing_project":"cartodb-gcp-backend-data-team","default_project":"cartodb-gcp-backend-data-team","service_account":"********"}}]
      },
      config: {
        isFirstTimeViewingDashboard: false
      }
    });
    const datasetsList = createConnections(store);

    expect(datasetsList).toMatchSnapshot();
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
        resolve: href => href,
        currentRoute: {
          name: 'testRoute'
        }
      }
    },
    store,
    localVue,
    propsData
  });
}
