import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ConnectorsList.vue', () => {
  beforeEach(() => {
  });

  describe('Render', () => {
    it('should render properly', () => {
      const store = createStore();
      const connectionComponent = createConnectorsList(store);

      expect(connectionComponent).toMatchSnapshot();
    });

    it('should request connector', async () => {
      const store = createStore();
      const connectionComponent = createConnectorsList(store);
      const spyRequestConnector = jest.spyOn(connectionComponent.vm, 'requestConnector');

      connectionComponent.setMethods({ requestedConnector: spyRequestConnector });
      connectionComponent.vm.$data.requestedConnector = 'TEST';
      connectionComponent.find('.Form-inputSubmitInline').trigger('click');
      expect(spyRequestConnector).toHaveBeenCalled();
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

function createConnectorsList (store, propsData) {
  return shallowMount(ConnectorsList, {
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
