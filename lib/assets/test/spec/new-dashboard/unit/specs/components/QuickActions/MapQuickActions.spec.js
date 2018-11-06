import { shallowMount } from '@vue/test-utils';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import visualization from '../../fixtures/visualizations';
import * as DialogActions from '../__mocks__/dialog-actions';

const $t = key => key;

describe('MapQuickAction.vue', () => {
  it('should render correct contents', () => {
    const map = visualization.visualizations[0];
    const mapQuickAction = shallowMount(MapQuickActions, {
      propsData: { map },
      mocks: {
        $t
      }
    });

    expect(mapQuickAction).toMatchSnapshot();
  });

  describe('methods', () => {
    it('should open edit metadata modal', () => {
      const map = visualization.visualizations[0];
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map },
        mocks: {
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
          $t
        }
      });

      mapQuickAction.vm.deleteMap();

      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });
  });
});
