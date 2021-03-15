import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import TilesetsComponent from 'new-dashboard/pages/Data/Tilesets/Tilesets';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Connections.vue', () => {
  beforeEach(() => {
  });

  describe('Errors', () => {
    it('should render error if user has not projects', () => {
      const store = createStore();
      const connectionsList = createTilesets(store);

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render error getting 401', () => {
      const store = createStore();
      const connectionsList = createTilesets(store);
      connectionsList.vm.$data.error = { status: 401 };

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render error getting 403', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: []
        },
        tilesets: {
          loadingTilesets: false
        },
        config: {
          isFirstTimeViewingDashboard: false
        }
      });
      const connectionsList = createTilesets(store);
      connectionsList.vm.$data.error = { status: 403 };

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render error getting 404 fetching datasets', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          projects: [{ id: 'project1', friendly_name: 'Project 1' }],
          connections: []
        },
        tilesets: {
          loadingTilesets: false
        }
      });

      const connectionsList = createTilesets(store);
      connectionsList.setMethods({ fetchDatasets: () => {} });

      connectionsList.vm.$data.project = { id: 'project1', label: 'Project 1' };
      connectionsList.vm.$data.error = { status: 404 };

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render no data when no tilesets', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          projects: [{ id: 'project1', friendly_name: 'Project 1' }],
          bqDatasets: [{ id: 'dataset1' }],
          connections: []
        },
        tilesets: {
          loadingTilesets: false
        }
      });

      const connectionsList = createTilesets(store);
      connectionsList.setMethods({ fetchDatasets: () => {} });

      connectionsList.vm.$data.project = { id: 'project1', label: 'Project 1' };
      connectionsList.vm.$data.dataset = { id: 'dataset1', label: 'dataset1' };

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Render', () => {
    it('should render list properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          projects: [{ id: 'project1', friendly_name: 'Project 1' }],
          bqDatasets: [{ id: 'dataset1' }],
          connections: []
        },
        tilesets: {
          loadingTilesets: false,
          tilesets: {
            result: [{
              id: 1,
              name: 'tile1'
            }, {
              id: 2,
              name: 'tile2'
            }, {
              id: 3,
              name: 'tile3'
            }]
          }
        }
      });

      const connectionsList = createTilesets(store);
      connectionsList.setMethods({ fetchDatasets: () => {}, fetchTilesets: () => {} });

      connectionsList.vm.$data.project = { id: 'project1', label: 'Project 1' };
      connectionsList.vm.$data.dataset = { id: 'dataset1', label: 'dataset1' };

      expect(connectionsList).toMatchSnapshot();
    });

    it('should render list with pagination properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          projects: [{ id: 'project1', friendly_name: 'Project 1' }],
          bqDatasets: [{ id: 'dataset1' }],
          connections: []
        },
        tilesets: {
          loadingTilesets: false,
          tilesets: {
            total: 25,
            result: [{
              id: 1,
              name: 'tile1'
            }, {
              id: 2,
              name: 'tile2'
            }, {
              id: 3,
              name: 'tile3'
            }]
          }
        }
      });

      const connectionsList = createTilesets(store);
      connectionsList.setMethods({ fetchDatasets: () => {}, fetchTilesets: () => {} });

      connectionsList.vm.$data.project = { id: 'project1', label: 'Project 1' };
      connectionsList.vm.$data.dataset = { id: 'dataset1', label: 'dataset1' };

      expect(connectionsList).toMatchSnapshot();
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    connectors: {
      loadingConnections: false,
      connections: []
    },
    tilesets: {
      loadingTilesets: false
    },
    config: {
      isFirstTimeViewingDashboard: false
    }
  };

  const storeInstance = new Vuex.Store({
    state: customStoreData || storeData,
    actions: {
      fetchBQDatasetsList: jest.fn()
    }
  });

  return storeInstance;
}

function createTilesets (store, propsData) {
  return shallowMount(TilesetsComponent, {
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
