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
      },
      config: {
        isFirstTimeViewingDashboard: false
      },
      user: {}
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
      },
      config: {
        isFirstTimeViewingDashboard: false
      },
      user: {}
    });
    const mapsList = createMapsList(store);

    expect(mapsList).toMatchSnapshot();
  });

  it('should update title with limit counter when user has limits', () => {
    const store = createStore({
      maps: {
        metadata: {},
        filterType: 'mine'
      },
      config: {
        isFirstTimeViewingDashboard: false
      },
      user: {
        public_map_quota: 10,
        link_privacy_map_count: 2,
        password_privacy_map_count: 3,
        public_privacy_map_count: 2
      }
    });
    const mapsList = createMapsList(store);

    expect(mapsList.vm.pageTitle).toBe(`MapsPage.header.title['mine'] (Public Maps 7/10)`);
  });

  it('should not show limit counter when user has limits and has reached quota', () => {
    const store = createStore({
      maps: {
        metadata: {},
        filterType: 'mine'
      },
      config: {
        isFirstTimeViewingDashboard: false
      },
      user: {
        public_map_quota: 10,
        link_privacy_map_count: 4,
        password_privacy_map_count: 3,
        public_privacy_map_count: 3
      }
    });
    const mapsList = createMapsList(store);

    expect(mapsList.vm.pageTitle).toBe(`MapsPage.header.title['mine']`);
  });

  it('should replace title for items number when selecting maps', () => {
    const store = createStore();
    const propsData = {
      hasBulkActions: true,
      canHoverCard: true,
      canChangeViewMode: false,
      isCondensedDefault: true,
      showViewAll: true
    };
    const mapsList = createMapsList(store, propsData);

    expect(mapsList.vm.pageTitle).toBe(`MapsPage.header.title['mine']`);

    const map = maps.visualizations[0];
    mapsList.setData({
      selectedMaps: [map]
    });

    expect(mapsList.vm.pageTitle).toBe('BulkActions.selected');
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

    it('toggleSelected: adds the map passed to selected maps list', () => {
      const store = createStore();
      const propsData = {
        canHoverCard: true
      };
      const mapsList = createMapsList(store, propsData);

      const map = maps.visualizations[0];
      const event = {
        shiftKey: shiftKey => false
      };
      const isSelected = true;
      mapsList.vm.toggleSelected({ map, isSelected, event });

      expect(mapsList.vm.selectedMaps[0]).toEqual(map);
      expect(mapsList.vm.lastCheckedItem).toEqual(map);
    });

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

    it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
      const store = createStore();
      const mapsList = createMapsList(store);

      mapsList.vm.onContentChanged();

      expect(mapsList.emitted('contentChanged')).toBeTruthy();
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
    },
    config: {
      isFirstTimeViewingDashboard: false
    },
    user: {}
  };

  const storeInstance = new Vuex.Store({
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
