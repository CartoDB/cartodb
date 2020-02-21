import Vuex from 'vuex';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import visualization from '../../fixtures/visualizations';
import * as DialogActions from '../__mocks__/dialog-actions';
import usersArray from '../../fixtures/users';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const localVue = createLocalVue();
localVue.use(Vuex);

const $t = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

let $cartoModels = configCartoModels();

const fetchDatasetsSpy = jest.fn();
let store = new Vuex.Store({
  state: {
    user: {
      organization: { id: 'fake-organization-id' }
    },
    config: {
      upgrade_url: 'http://{user}.example.com/upgrade'
    }
  },
  actions: {
    'maps/fetch': fetchDatasetsSpy
  }
});

describe('MapQuickAction.vue', () => {
  it('should render correct contents', () => {
    const map = visualization.visualizations[0];
    const mapQuickAction = createMapQuickActionComponent(map);

    expect(mapQuickAction).toMatchSnapshot();
  });

  it('should not render the component if the map is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
    const map = visualization.visualizations[0];
    const mapQuickAction = createMapQuickActionComponent(map);

    expect(mapQuickAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "locked" action name when a map is locked', () => {
      const map = {...visualization.visualizations[0]};
      map.locked = true;
      const mapQuickAction = createMapQuickActionComponent(map);

      const result = mapQuickAction.vm.actionMode;

      expect(result).toBe('locked');
    });

    it('should return "mine" action name when a map is not locked', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);

      const result = mapQuickAction.vm.actionMode;

      expect(result).toBe('mine');
    });
  });

  describe('methods', () => {
    it('should call the function to show modal', () => {
      const map = visualization.visualizations[0];
      const $modal = { show: jest.fn() };
      const mapQuickAction = createMapQuickActionComponent(map, { $modal });

      mapQuickAction.vm.showModal();

      expect($modal.show).toHaveBeenCalled();
    });

    it('should emit event open when calling openQuickactions method', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      expect(mapQuickAction.emitted('open')).toBeFalsy();

      mapQuickAction.vm.openQuickactions();

      expect(mapQuickAction.emitted('open').length).toBe(1);
    });

    it('should emit event close when calling closeQuickactions method', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      expect(mapQuickAction.emitted('close')).toBeFalsy();

      mapQuickAction.vm.closeQuickactions();

      expect(mapQuickAction.emitted('close').length).toBe(1);
    });

    it('should open edit metadata modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.editInfo();

      expect(DialogActions.editMapMetadata).toHaveBeenCalled();
    });

    it('should open change privacy modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.changePrivacy();

      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open manage tags modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.manageTags();

      expect(DialogActions.editMapMetadata).toHaveBeenCalled();
    });

    it('should launch share with colleagues action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.shareVisualization();

      expect(DialogActions.shareVisualization).toHaveBeenCalled();
    });

    it('should launch duplicate map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.duplicateMap();

      expect(DialogActions.duplicateVisualization).toHaveBeenCalled();
    });

    it('should launch unlock map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.unlockMap();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch lock map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.lockMap();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch delete map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = createMapQuickActionComponent(map);
      mapQuickAction.vm.closeDropdown = jest.fn();

      mapQuickAction.vm.deleteMap();

      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });
  });

  describe('Action Handlers', () => {
    describe('fetchList', () => {
      it('should dispatch store actions and emit contentChanged event', () => {
        const map = visualization.visualizations[0];
        const mapQuickAction = createMapQuickActionComponent(map);
        const actionHandlers = mapQuickAction.vm.getActionHandlers();

        actionHandlers.fetchList();

        expect(fetchDatasetsSpy).toHaveBeenCalled();
        expect(mapQuickAction.emitted('contentChanged')).toBeTruthy();
      });
    });
  });
});

function createMapQuickActionComponent (map, additionalMocks) {
  return shallowMount(MapQuickActions, {
    store,
    localVue,
    propsData: { map, hasShadow: false },
    mocks: {
      $cartoModels,
      $t,
      ...additionalMocks
    }
  });
}
