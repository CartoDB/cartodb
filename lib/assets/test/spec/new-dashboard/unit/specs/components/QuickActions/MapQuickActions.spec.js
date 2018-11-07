import { shallowMount } from '@vue/test-utils';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import visualization from '../../fixtures/visualizations';
import * as DialogActions from '../__mocks__/dialog-actions';
import usersArray from '../../fixtures/users';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const $t = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

let $cartoModels = configCartoModels();

describe('MapQuickAction.vue', () => {
  it('should render correct contents', () => {
    const map = visualization.visualizations[0];
    const mapQuickAction = shallowMount(MapQuickActions, {
      propsData: { map },
      mocks: {
        $cartoModels,
        $t
      }
    });

    expect(mapQuickAction).toMatchSnapshot();
  });

  it('should not render the component if the map is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
    const map = visualization.visualizations[0];
    const mapQuickAction = shallowMount(MapQuickActions, {
      propsData: { map },
      mocks: {
        $cartoModels,
        $t
      }
    });

    expect(mapQuickAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "locked" action name when a map is locked', () => {
      const map = {...visualization.visualizations[0]};
      map.locked = true;
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      const result = mapQuickAction.vm.actionMode;

      expect(result).toBe('locked');
    });

    it('should return "mine" action name when a map is not locked', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      const result = mapQuickAction.vm.actionMode;

      expect(result).toBe('mine');
    });
  });

  describe('methods', () => {
    it('should open edit metadata modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.editInfo();

      expect(DialogActions.editMapMetadata).toHaveBeenCalled();
    });

    it('should open change privacy modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.changePrivacy();

      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open manage tags modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.manageTags();

      expect(DialogActions.editMapMetadata).toHaveBeenCalled();
    });

    it('should launch duplicate map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.duplicateMap();

      expect(DialogActions.duplicateMap).toHaveBeenCalled();
    });

    it('should launch unlock map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.unlockMap();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch lock map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.lockMap();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch delete map action', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapQuickAction.vm.deleteMap();

      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });
  });
});
