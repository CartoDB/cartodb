import Vuex from 'vuex';
import { createLocalVue, mount } from '@vue/test-utils';
import BigQuerySelectionMode from 'new-dashboard/components/Connector/BigQuerySelectionMode';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

const localVue = createLocalVue();
localVue.use(Vuex);

jest.mock('new-dashboard/store/utils/getCARTOData', () => jest.fn(() => ({})));

describe('BigQuerySelectionMode.vue', () => {
  beforeEach(() => {
  });

  describe('Render', () => {
    it('should render properly', () => {
      const store = createStore();
      getCARTOData.mockReturnValueOnce({ config: { oauth_bigquery: true } });
      const connectionComponent = createBigQuerySelectionMode(store);
      expect(connectionComponent).toMatchSnapshot();
    });

    it('should skip mode selection if oauth is not enabled', () => {
      const store = createStore();
      getCARTOData.mockReturnValueOnce({ config: { oauth_bigquery: false } });
      const connectionComponent = createBigQuerySelectionMode(store);

      expect(connectionComponent).toMatchSnapshot();
    });

    it('should render Service account editing a service account connection', () => {
      const store = createStore();
      const connectionComponent = createBigQuerySelectionMode(store, {
        connection: {
          type: 'db-connector'
        }
      });

      expect(connectionComponent).toMatchSnapshot();
    });

    it('should render OAuth version editing an oauth connection', () => {
      const store = createStore();
      const connectionComponent = createBigQuerySelectionMode(store, {
        connection: {
          type: 'oauth-service'
        }
      });

      expect(connectionComponent).toMatchSnapshot();
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

function createBigQuerySelectionMode (store, propsData) {
  return mount(BigQuerySelectionMode, {
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
