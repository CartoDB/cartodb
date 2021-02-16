import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import datasets from '../fixtures/datasets';
import DatasetsList from 'new-dashboard/components/DatasetsList';

jest.mock('new-dashboard/components/CreateButton', () => {});

const localVue = createLocalVue();
localVue.use(Vuex);

describe('DatasetsList.vue', () => {
  it('should render properly', () => {
    const store = createStore();
    const propsData = {
      hasBulkActions: true,
      canHoverCard: true
    };
    const datasetsList = createDatasetsList(store, propsData);

    expect(datasetsList).toMatchSnapshot();
  });

  it('should render initial state', () => {
    const store = createStore({
      datasets: {
        isFetchingDatasets: false,
        list: [],
        metadata: {
          total_user_entries: 0,
          total_shared: 0
        },
        filterType: 'mine'
      },
      connectors: {
        loadingConnections: false,
        connections: []
      },
      config: {
        isFirstTimeViewingDashboard: true
      }
    });
    const datasetsList = createDatasetsList(store);

    expect(datasetsList).toMatchSnapshot();
  });

  it('should render empty state', () => {
    const store = createStore({
      datasets: {
        isFetchingDatasets: false,
        list: [],
        metadata: {
          total_entries: 0,
          total_user_entries: 2
        },
        filterType: 'mine'
      },
      config: {
        isFirstTimeViewingDashboard: false
      }
    });
    const datasetsList = createDatasetsList(store);

    expect(datasetsList).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('applyOrder: should dispatch datasets/order with order options', () => {
      const store = createStore();
      const datasetsList = createDatasetsList(store);

      datasetsList.vm.applyOrder({ order: 'updated_at', direction: 'asc' });

      expect(datasetsList.emitted('applyOrder').length).toBe(1);
    });

    it('applyFilter: should dispatch datasets/filter with filter type', () => {
      const store = createStore();
      const datasetsList = createDatasetsList(store);

      datasetsList.vm.applyFilter('locked');

      expect(datasetsList.emitted('applyFilter').length).toBe(1);
    });

    it('fetchDatasets: should dispatch datasets/fetch', () => {
      const store = createStore();
      spyOn(store, 'dispatch');
      const datasetsList = createDatasetsList(store);

      datasetsList.vm.fetchDatasets();

      expect(store.dispatch).toHaveBeenCalledWith('datasets/fetch');
    });

    it('hasFilterApplied: should return true if applied filter is equal to the one passed', () => {
      const store = createStore();
      const datasetsList = createDatasetsList(store);

      expect(datasetsList.vm.hasFilterApplied('mine')).toBe(true);
    });

    it('toggleSelected: adds the dataset passed to selected datasets list', () => {
      const store = createStore();
      const propsData = {
        canHoverCard: true
      };
      const datasetsList = createDatasetsList(store, propsData);

      const dataset = datasets.visualizations[0];
      const event = {
        shiftKey: shiftKey => false
      };
      const isSelected = true;
      datasetsList.vm.toggleSelected({ dataset, isSelected, event });

      expect(datasetsList.vm.selectedDatasets[0]).toEqual(dataset);
      expect(datasetsList.vm.lastCheckedItem).toEqual(dataset);
    });

    it('selectAll: marks all datasets as selected', () => {
      const store = createStore();
      const datasetsList = createDatasetsList(store);
      datasetsList.setData({
        selectedDatasets: []
      });
      datasetsList.vm.selectAll();

      expect(datasetsList.vm.selectedDatasets).toEqual(datasets.visualizations);
    });

    it('isDatasetSelected: returns true if dataset is selected', () => {
      const dataset = datasets.visualizations[0];
      const store = createStore();
      const datasetsList = createDatasetsList(store);
      datasetsList.setData({
        selectedDatasets: [dataset]
      });
      expect(datasetsList.vm.isDatasetSelected(dataset)).toBe(true);
    });

    it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
      const store = createStore();
      const datasetsList = createDatasetsList(store);

      datasetsList.vm.onContentChanged();

      expect(datasetsList.emitted('contentChanged')).toBeTruthy();
    });

    describe('showCreateButton', () => {
      it('should return false if there is any dataset selected', () => {
        const store = createStore({
          datasets: {
            isFetchingDatasets: false,
            list: datasets.visualizations,
            metadata: {
              total_user_entries: 0,
              total_entries: 0
            },
            filterType: 'mine',
            order: 'updated_at',
            orderDirection: 'desc'
          },
          config: {
            isFirstTimeViewingDashboard: false
          },
          user: {
            account_type: 'account_type'
          }
        });
        const datasetsList = createDatasetsList(store);
        const dataset = datasets.visualizations[0];
        datasetsList.setData({
          selectedDatasets: [dataset]
        });

        expect(datasetsList.vm.showCreateButton).toEqual(false);
      });

      it('should return true if there is any user entry', () => {
        const store = createStore({
          datasets: {
            isFetchingDatasets: false,
            list: datasets.visualizations,
            metadata: {
              total_user_entries: 2,
              total_entries: 2
            },
            filterType: 'mine',
            order: 'updated_at',
            orderDirection: 'desc'
          },
          config: {
            isFirstTimeViewingDashboard: true
          },
          user: {
            account_type: 'account_type'
          }
        });
        const datasetsList = createDatasetsList(store);

        expect(datasetsList.vm.showCreateButton).toEqual(true);
      });

      it('should return true if it is not the first time the user sees the dashboard', () => {
        const store = createStore({
          datasets: {
            isFetchingDatasets: false,
            list: datasets.visualizations,
            metadata: {
              total_user_entries: 0,
              total_entries: 0
            },
            filterType: 'mine',
            order: 'updated_at',
            orderDirection: 'desc'
          },
          config: {
            isFirstTimeViewingDashboard: false
          },
          user: {
            account_type: 'account_type'
          }
        });
        const datasetsList = createDatasetsList(store);

        expect(datasetsList.vm.showCreateButton).toEqual(true);
      });

      it('should return false if there are no user entries and it the first time in the dashboard', () => {
        const store = createStore({
          datasets: {
            isFetchingDatasets: false,
            list: datasets.visualizations,
            metadata: {
              total_user_entries: 0,
              total_entries: 0
            },
            filterType: 'mine',
            order: 'updated_at',
            orderDirection: 'desc'
          },
          connectors: {
            loadingConnections: false,
            connections: []
          },
          config: {
            isFirstTimeViewingDashboard: true
          },
          user: {
            account_type: 'account_type'
          }
        });
        const datasetsList = createDatasetsList(store);

        expect(datasetsList.vm.showCreateButton).toEqual(false);
      });
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    datasets: {
      isFetchingDatasets: false,
      list: datasets.visualizations,
      metadata: {
        total_user_entries: 2,
        total_entries: 2
      },
      filterType: 'mine',
      order: 'updated_at',
      orderDirection: 'desc'
    },
    connectors: {
      loadingConnections: false,
      connections: []
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

function createDatasetsList (store, propsData) {
  return shallowMount(DatasetsList, {
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
