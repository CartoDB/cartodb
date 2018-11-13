import { mount } from '@vue/test-utils';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions';
import maps from '../../fixtures/visualizations';
import mapsLocked from '../../fixtures/visualizationsLocked';
import * as DialogActions from '../__mocks__/dialog-actions';

const $t = key => key;

describe('MapBulkActions.vue', () => {
  it('should render all bulk actions', () => {
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: false,
        selectedMaps: []
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions for all selected "Deselect all", "Lock maps" and "Delete maps" actions', () => {
    const data = maps.visualizations;
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: true,
        selectedMaps: data
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all single actions: "Select all", "Create map", "Change privacy", "Duplicate map", "Lock map", "Delete map"', () => {
    const data = maps.visualizations.slice(0, 1);
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: false,
        selectedMaps: data
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions: "Select all", "Deselect all", "Lock maps", "Delete maps"', () => {
    const data = maps.visualizations;
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: false,
        selectedMaps: data
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render single locked action: "Unlock map"', () => {
    const data = mapsLocked.visualizations;
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: false,
        selectedMaps: data
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  it('should render multiple locked action: "Unlock maps"', () => {
    const data = mapsLocked.visualizations.slice(0, 2);
    const mapBulkAction = mount(MapBulkActions, {
      propsData: {
        areAllMapsSelected: false,
        selectedMaps: data
      },
      mocks: {
        $t
      }
    });
    expect(mapBulkAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "multiple" action name when more than one map is selected', () => {
      const data = maps.visualizations;
      const mapBulkAction = mount(MapBulkActions, {
        propsData: {
          selectedMaps: data
        },
        mocks: {
          $t
        }
      });

      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('multiple');
    });

    it('should return "single" action name when there is only a map selected', () => {
      const data = maps.visualizations.slice(0, 1);
      const mapBulkAction = mount(MapBulkActions, {
        propsData: {
          selectedMaps: data
        },
        mocks: {
          $t
        }
      });
      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('single');
    });

    it('should return "lock" action name when there is only a locked map selected', () => {
      const data = mapsLocked.visualizations.slice(0, 1);
      const mapBulkAction = mount(MapBulkActions, {
        propsData: {
          selectedMaps: data
        },
        mocks: {
          $t
        }
      });
      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('lock');
    });

    it('should return "multipleLock" action name when there are more than one locked map selected', () => {
      const data = mapsLocked.visualizations;
      const mapBulkAction = mount(MapBulkActions, {
        propsData: {
          selectedMaps: data
        },
        mocks: {
          $t
        }
      });
      const result = mapBulkAction.vm.actionMode;
      expect(result).toBe('multipleLock');
    });
  });

  describe('methods', () => {
    let $modal;
    let data;
    let mapBulkAction;
    beforeEach(function () {
      $modal = {
        show: jest.fn()
      };
      data = maps.visualizations;
      mapBulkAction = mount(MapBulkActions, {
        propsData: {
          selectedMaps: data
        },
        mocks: {
          $modal,
          $t,
          backboneViews: {
            backgroundPollingView: {
              getBackgroundPollingView () {
                return {};
              }
            }
          }
        }
      });
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
      expect(DialogActions.duplicateMap).toHaveBeenCalled();
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
      mapBulkAction.vm.deleteMap();
      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });

    it('should open delete visualizations dialog', () => {
      mapBulkAction.vm.deleteMaps();
      expect(DialogActions.deleteVisualizations).toHaveBeenCalled();
    });
  });
});
