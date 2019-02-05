import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import datasets from '../../../fixtures/datasets';
import DatasetsSection from 'new-dashboard/pages/Home/DatasetsSection/DatasetsSection';

jest.mock('new-dashboard/components/CreateButton', () => {});

const $t = key => key;

const localVue = createLocalVue();
localVue.use(Vuex);

describe('DatasetsSection.vue', () => {
  it('should render properly', () => {
    const store = createStore();
    const datasetsSection = createDatasetsSection(store);
    expect(datasetsSection).toMatchSnapshot();
  });

  it('should render initial state', () => {
    const store = createStore({
      datasets: {
        isFetchingDatasets: false,
        list: datasets.visualizations,
        metadata: {
          total_user_entries: 0
        },
        filterType: 'mine'
      }
    });

    const datasetsSection = createDatasetsSection(store);
    expect(datasetsSection).toMatchSnapshot();
  });

  it('should render emptyState', () => {
    const store = createStore({
      datasets: {
        isFetchingDatasets: false,
        datasets: datasets.visualizations,
        metadata: {
          total_entries: 0
        },
        filterType: 'locked'
      }
    });
    const datasetsSection = createDatasetsSection(store);
    expect(datasetsSection).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('applyOrder: should dispatch datasets/order with order options', () => {
      const store = createStore();
      spyOn(store, 'dispatch');

      const datasetsSection = createDatasetsSection(store);

      datasetsSection.vm.applyOrder({ order: 'updated_at', direction: 'desc' });

      expect(store.dispatch).toHaveBeenCalledWith('datasets/order', {
        order: 'updated_at',
        direction: 'desc'
      });
    });

    it('applyFilter: should dispatch datasets/filter with filter type', () => {
      const store = createStore();
      spyOn(store, 'dispatch');

      const datasetsSection = createDatasetsSection(store);

      datasetsSection.vm.applyFilter('locked');

      expect(store.dispatch).toHaveBeenCalledWith('datasets/filter', 'locked');
    });

    it('fetchDatasets: should dispatch datasets/fetch', () => {
      const store = createStore();
      spyOn(store, 'dispatch');

      const datasetsSection = createDatasetsSection(store);

      datasetsSection.vm.fetchDatasets();

      expect(store.dispatch).toHaveBeenCalledWith('datasets/fetch');
    });

    it('hasFilterApplied: should return true if applied filter is equal to the one passed', () => {
      const store = createStore();
      const datasetsSection = createDatasetsSection(store);

      expect(datasetsSection.vm.hasFilterApplied('mine')).toBe(true);
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    datasets: {
      isFetchingDatasets: false,
      datasets: datasets.visualizations,
      metadata: {
        total_user_entries: 2,
        total_entries: 2
      },
      filterType: 'mine',
      order: 'updated_at',
      orderDirection: 'desc'
    }
  };

  let storeInstance = new Vuex.Store({
    state: customStoreData || storeData
  });

  return storeInstance;
}

function createDatasetsSection (store) {
  return shallowMount(DatasetsSection, {
    mocks: { $t },
    store,
    localVue
  });
}
