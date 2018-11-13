import { mount } from '@vue/test-utils';
import DatasetBulkActions from 'new-dashboard/components/BulkActions/DatasetBulkActions';
import datasets from '../../fixtures/datasets';
import datasetsLocked from '../../fixtures/datasetsLocked';
import * as DialogActions from '../__mocks__/dialog-actions';

const $t = key => key;

describe('DatasetBulkActions.vue', () => {
  it('should render all bulk actions', () => {
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: false,
        selectedDatasets: []
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions for all selected "Deselect all", "Lock datasets" and "Delete datasets" actions', () => {
    const data = datasets.visualizations;
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: true,
        selectedDatasets: data
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all single actions: "Select all", "Create map", "Change privacy", "Duplicate dataset", "Lock dataset", "Delete dataset"', () => {
    const data = datasets.visualizations.slice(0, 1);
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: false,
        selectedDatasets: data
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions: "Select all", "Deselect all", "Lock datasets", "Delete datasets"', () => {
    const data = datasets.visualizations;
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: false,
        selectedDatasets: data
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render single locked action: "Unlock dataset"', () => {
    const data = datasetsLocked.visualizations;
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: false,
        selectedDatasets: data
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render multiple locked action: "Unlock datasets"', () => {
    const data = datasetsLocked.visualizations.slice(0, 2);
    const datasetBulkAction = mount(DatasetBulkActions, {
      propsData: {
        areAllDatasetsSelected: false,
        selectedDatasets: data
      },
      mocks: {
        $t
      }
    });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "multiple" action name when more than one dataset is selected', () => {
      const data = datasets.visualizations;
      const datasetBulkAction = mount(DatasetBulkActions, {
        propsData: {
          selectedDatasets: data
        },
        mocks: {
          $t
        }
      });

      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('multiple');
    });

    it('should return "single" action name when there is only a dataset selected', () => {
      const data = datasets.visualizations.slice(0, 1);
      const datasetBulkAction = mount(DatasetBulkActions, {
        propsData: {
          selectedDatasets: data
        },
        mocks: {
          $t
        }
      });
      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('single');
    });

    it('should return "lock" action name when there is only a locked dataset selected', () => {
      const data = datasetsLocked.visualizations.slice(0, 1);
      const datasetBulkAction = mount(DatasetBulkActions, {
        propsData: {
          selectedDatasets: data
        },
        mocks: {
          $t
        }
      });
      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('lock');
    });

    it('should return "multipleLock" action name when there are more than one locked dataset selected', () => {
      const data = datasetsLocked.visualizations;
      const datasetBulkAction = mount(DatasetBulkActions, {
        propsData: {
          selectedDatasets: data
        },
        mocks: {
          $t
        }
      });
      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('multipleLock');
    });
  });

  describe('methods', () => {
    let $modal;
    let data;
    let datasetBulkAction;
    beforeEach(function () {
      $modal = {
        show: jest.fn()
      };
      data = datasets.visualizations;
      datasetBulkAction = mount(DatasetBulkActions, {
        propsData: {
          selectedDatasets: data
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
      datasetBulkAction.vm.showModal();
      expect($modal.show).toHaveBeenCalled();
    });

    it('should call the function selectAll', () => {
      datasetBulkAction.vm.selectAll();
      expect(datasetBulkAction.emitted('selectAll').length).toBe(1);
    });

    it('should call the function deselectAll', () => {
      datasetBulkAction.vm.deselectAll();
      expect(datasetBulkAction.emitted('deselectAll').length).toBe(1);
    });

    it('should open create map', () => {
      datasetBulkAction.vm.createMap();
      expect(DialogActions.createMap).toHaveBeenCalled();
    });

    it('should open change privacy modal', () => {
      datasetBulkAction.vm.changePrivacy();
      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open duplicate dataset modal', () => {
      datasetBulkAction.vm.duplicateDataset();
      expect(DialogActions.duplicateDataset).toHaveBeenCalled();
    });

    it('should open change visualizations lock state dialog via unlockDatasets funcion', () => {
      datasetBulkAction.vm.unlockDatasets();
      expect(DialogActions.changeVisualizationsLockState).toHaveBeenCalled();
    });

    it('should open change visualizations lock state dialog via lockDatasets funcion', () => {
      datasetBulkAction.vm.lockDatasets();
      expect(DialogActions.changeVisualizationsLockState).toHaveBeenCalled();
    });

    it('should open change lock state dialog via lockDataset function', () => {
      datasetBulkAction.vm.lockDataset();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should open change lock state dialog via unlockDataset function', () => {
      datasetBulkAction.vm.unlockDataset();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should open delete visualization dialog', () => {
      datasetBulkAction.vm.deleteDataset();
      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });

    it('should open delete visualizations dialog', () => {
      datasetBulkAction.vm.deleteDatasets();
      expect(DialogActions.deleteVisualizations).toHaveBeenCalled();
    });
  });
});
