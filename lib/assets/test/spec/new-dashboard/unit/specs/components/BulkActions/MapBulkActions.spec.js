import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions';
import maps from '../../fixtures/visualizations';
import mapsLocked from '../../fixtures/visualizationsLocked';
import * as DialogActions from '../__mocks__/dialog-actions';

const $t = key => key;
const localVue = createLocalVue();
localVue.use(Vuex);

describe('MapBulkActions.vue', () => {
  it('should render all bulk actions', () => {
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: [], areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions for all selected "Deselect all", "Lock" and "Delete" actions', () => {
    const data = maps.visualizations;
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all single actions: "Select all", "Create map", "Change privacy", "Duplicate", "Lock", "Delete"', () => {
    const data = maps.visualizations.slice(0, 1);
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions: "Select all", "Deselect all", "Lock", "Delete"', () => {
    const data = maps.visualizations;
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render single locked action: "Unlock"', () => {
    const data = mapsLocked.visualizations;
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render multiple locked action: "Unlock"', () => {
    const data = mapsLocked.visualizations.slice(0, 2);
    const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, areAllMapsSelected: false, isAnyShared: false });
    expect(mapBulkAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "multiple" action name when more than one map is selected', () => {
      const data = mapsLocked.visualizations;
      const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, isAnyShared: false });
      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('multiple');
    });

    it('should return "single" action name when there is only a map selected', () => {
      const data = maps.visualizations.slice(0, 1);
      const { mapBulkAction } = createMapBulkActionsComponent({ selectedMaps: data, isAnyShared: false });
      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('single');
    });
  });

  describe('methods', () => {
    let $modal;
    let mapBulkAction;
    beforeEach(function () {
      const { mapBulkAction: mapBulkActionComponent, $modal: $modalInstance } = createMapBulkActionsComponent();
      $modal = $modalInstance;
      mapBulkAction = mapBulkActionComponent;
    });

    it('should return all events listened', () => {
      const events = {
        'deleteMaps': {},
        'deselectAll': {},
        'lockMaps': {},
        'selectAll': {}
      };
      expect(mapBulkAction.vm.getEventListeners()).toMatchObject(events);
    });

    it('should call the function to show modal', () => {
      mapBulkAction.vm.showModal();
      expect($modal.show).toHaveBeenCalled();
    });

    it('should call the function selectAll', () => {
      mapBulkAction.vm.selectAll();
      expect(mapBulkAction.emitted('selectAll').length).toBe(1);
    });

    it('should call the function deselectAll', () => {
      mapBulkAction.vm.deselectAll();
      expect(mapBulkAction.emitted('deselectAll').length).toBe(1);
    });

    it('should open change privacy modal', () => {
      mapBulkAction.vm.changePrivacy();
      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open duplicate map modal', () => {
      mapBulkAction.vm.duplicateMap();
      expect(DialogActions.duplicateVisualization).toHaveBeenCalled();
    });

    it('should open change visualizations lock state dialog via unlockMaps funcion', () => {
      mapBulkAction.vm.unlockMaps();
      expect(DialogActions.changeVisualizationsLockState).toHaveBeenCalled();
    });

    it('should open change lock state dialog via lockMap function', () => {
      mapBulkAction.vm.lockMap();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should open change visualizations lock state dialog via lockMaps funcion', () => {
      mapBulkAction.vm.lockMaps();
      expect(DialogActions.changeVisualizationsLockState).toHaveBeenCalled();
    });

    it('should open change lock state dialog via unlockMap function', () => {
      mapBulkAction.vm.unlockMap();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should open change lock state dialog via unlockMaps function', () => {
      mapBulkAction.vm.unlockMaps();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should open delete visualization dialog', () => {
      const spy = spyOn(mapBulkAction.vm, 'deselectAll');
      mapBulkAction.vm.deleteMap();
      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should open delete visualizations dialog', () => {
      mapBulkAction.vm.deleteMaps();
      expect(DialogActions.deleteVisualizations).toHaveBeenCalled();
    });
  });
});

function createMapBulkActionsComponent (options = { selectedMaps: maps.visualizations, areAllMapsSelected: false, isAnyShared: false }) {
  const $modal = {
    show: jest.fn()
  };
  const $store = new Vuex.Store({
    state: {
      user: {
        isOutOfPublicMapsQuota: false
      }
    }
  });
  const mapBulkAction = mount(MapBulkActions, {
    propsData: {
      selectedMaps: options.selectedMaps,
      areAllMapsSelected: options.areAllMapsSelected
    },
    mocks: {
      $modal,
      $t,
      $store,
      backboneViews: {
        backgroundPollingView: {
          getBackgroundPollingView () {
            return {};
          }
        }
      }
    },
    computed: {
      isAnyShared: () => options.isAnyShared
    }
  });

  return { $modal, mapBulkAction };
}
