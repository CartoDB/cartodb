import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import maps from '../fixtures/visualizations';
import MapsList from 'new-dashboard/components/MapsList';

jest.mock('new-dashboard/components/CreateButton', () => {});

const localVue = createLocalVue();
localVue.use(Vuex);

describe('MapsList.vue', () => {
  it('should render properly with condensed card and without change view mode available', () => {
    const store = createStore();
    const propsData = {
      hasBulkActions: true,
      canHoverCard: true,
      canChangeViewMode: false,
      isCondensedDefault: true,
      showViewAll: true
    };
    const mapsList = createMapsList(store, propsData);

    expect(mapsList).toMatchSnapshot();
  });

  it('should render properly with simple card and with change view mode available', () => {
    const store = createStore();
    const propsData = {
      hasBulkActions: true,
      canHoverCard: true,
      canChangeViewMode: true,
      isCondensedDefault: false,
      showViewAll: true
    };
    const mapsList = createMapsList(store, propsData);

    expect(mapsList).toMatchSnapshot();
  });
  it('should render initial state', () => {
    const store = createStore({
      maps: {
        isFetchingMaps: false,
        list: [],
        metadata: {
          total_user_entries: 0
        },
        filterType: 'mine'
      }
    });
    const mapsList = createMapsList(store);

    expect(mapsList).toMatchSnapshot();
  });

  it('should render empty state', () => {
    const store = createStore({
      maps: {
        isFetchingMaps: false,
        list: [],
        metadata: {
          total_entries: 0,
          total_user_entries: 2
        },
        filterType: 'mine'
      }
    });
    const mapsList = createMapsList(store);

    expect(mapsList).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('applyOrder: should dispatch maps/order with order options', () => {
      const store = createStore();
      const mapsList = createMapsList(store);

      mapsList.vm.applyOrder({ order: 'updated_at', direction: 'asc' });

      expect(mapsList.emitted('applyOrder').length).toBe(1);
    });

    it('applyFilter: should dispatch maps/filter with filter type', () => {
      const store = createStore();
      const mapsList = createMapsList(store);

      mapsList.vm.applyFilter('locked');

      expect(mapsList.emitted('applyFilter').length).toBe(1);
    });

    it('fetchMaps: should dispatch maps/fetch', () => {
      const store = createStore();
      spyOn(store, 'dispatch');
      const mapsList = createMapsList(store);

      mapsList.vm.fetchMaps();

      expect(store.dispatch).toHaveBeenCalledWith('maps/fetch');
    });

    it('hasFilterApplied: should return true if applied filter is equal to the one passed', () => {
      const store = createStore();
      const mapsList = createMapsList(store);

      expect(mapsList.vm.hasFilterApplied('mine')).toBe(true);
    });
  //   xit('toggleSelected: marks as selected the dataset passed', () => {
  //     const store = createStore();
  //     const mapsList = createMapsList(store);

  //     const card = mapsList.find('.dataset-item');
  //     card.trigger('click');

  //     expect(mapsList.vm.selectedMaps).toEqual(true);
  //   });
    it('selectAll: marks all maps as selected', () => {
      const store = createStore();
      const mapsList = createMapsList(store);
      mapsList.setProps({
        canHoverCard: true
      });
      mapsList.setProps({
        selectedMaps: []
      });
      mapsList.vm.selectAll();

      expect(mapsList.vm.selectedMaps).toEqual(maps.visualizations);
    });
    it('isMapSelected: returns true if dataset is selected', () => {
      const map = maps.visualizations[0];
      const store = createStore();
      const mapsList = createMapsList(store);
      mapsList.setData({
        selectedMaps: [map]
      });
      expect(mapsList.vm.isMapSelected(map)).toBe(true);
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    maps: {
      isFetchingMaps: false,
      list: maps.visualizations,
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

function createMapsList (store, propsData) {
  return shallowMount(MapsList, {
    mocks: {
      $t: key => key,
      $router: {
        resolve: href => href
      }
    },
    store,
    localVue,
    propsData
  });
}
