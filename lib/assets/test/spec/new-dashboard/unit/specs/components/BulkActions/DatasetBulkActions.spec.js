import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import DatasetBulkActions from 'new-dashboard/components/BulkActions/DatasetBulkActions';
import datasets from '../../fixtures/datasets';
import datasetsShared from '../../fixtures/datasetsShared';
import datasetsLocked from '../../fixtures/datasetsLocked';
import * as DialogActions from '../__mocks__/dialog-actions';

const $t = key => key;

const localVue = createLocalVue();
localVue.use(Vuex);

describe('DatasetBulkActions.vue', () => {
  it('should render all bulk actions', () => {
    const datasetBulkAction = createDatasetBulkActionComponent({selectedDatasets: []});
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions for all selected when there are no locked or shared datasets "Deselect all", "Create map", "Lock" and "Delete" actions', () => {
    const datasetBulkAction = createDatasetBulkActionComponent({ allSelected: true });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all single actions: "Select all", "Create map", "Change privacy", "Duplicate", "Lock", "Delete"', () => {
    const selectedDatasets = datasets.visualizations.slice(0, 1);
    const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render all multiple actions: "Select all", "Deselect all", "Create map", "Lock", "Delete"', () => {
    const datasetBulkAction = createDatasetBulkActionComponent({});
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render single locked actions: "Select all", "Duplicate" and "Unlock"', () => {
    const selectedDatasets = datasetsLocked.visualizations.slice(0, 1);
    const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render multiple locked actions when not all datasets have been selected: "Select all", Deselect all" and "Unlock"', () => {
    const selectedDatasets = datasetsLocked.visualizations.slice(0, 2);
    const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render multiple actions for a single shared dataset: "Select All", "Create Map", "Duplicate"', () => {
    const selectedDatasets = datasets.visualizations.slice(0, 1);
    const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets, isAnyShared: true });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  it('should render multiple actions for selection containing shared datasets: "Select All", "Create Map", "Deselect All"', () => {
    const datasetBulkAction = createDatasetBulkActionComponent({ isAnyShared: true });
    expect(datasetBulkAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "multiple" action name when more than one dataset is selected', () => {
      const datasetBulkAction = createDatasetBulkActionComponent({});
      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('multiple');
    });

    it('should return "single" action name when there is only a dataset selected', () => {
      const selectedDatasets = datasets.visualizations.slice(0, 1);
      const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets });
      const result = datasetBulkAction.vm.actionMode;
      expect(result).toBe('single');
    });
  });

  describe('methods', () => {
    let datasetBulkAction;
    beforeEach(() => {
      datasetBulkAction = createDatasetBulkActionComponent({});
    });

    it('should return all events listened', () => {
      const events = {
        'deleteDatasets': {},
        'deselectAll': {},
        'lockDatasets': {},
        'selectAll': {}
      };
      expect(datasetBulkAction.vm.getEventListeners()).toMatchObject(events);
    });

    it('should call the function to show modal', () => {
      datasetBulkAction.vm.showModal();
      expect(datasetBulkAction.vm.$modal.show).toHaveBeenCalled();
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
      const selectedDatasets = datasetsShared.visualizations.slice(0, 1);
      const datasetBulkAction = createDatasetBulkActionComponent({ selectedDatasets });
      const spy = spyOn(datasetBulkAction.vm, 'deselectAll');

      datasetBulkAction.vm.duplicateDataset();

      const bgPollingView = datasetBulkAction.vm.backboneViews.backgroundPollingView.getBackgroundPollingView();
      expect(bgPollingView._addDataset).toHaveBeenCalledWith(expect.objectContaining({
        value: selectedDatasets[0].table.name
      }));
      expect(spy).toHaveBeenCalled();
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
      const spy = spyOn(datasetBulkAction.vm, 'deselectAll');
      datasetBulkAction.vm.deleteDataset();
      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
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

function createDatasetBulkActionComponent ({ selectedDatasets = datasets.visualizations, allSelected = false, isAnyShared = false }) {
  const _addDataset = jest.fn();
  const $modal = {
    show: jest.fn()
  };
  const $store = new Vuex.Store({
    state: {
      user: {
        isOutOfDatasetsQuota: false
      }
    }
  });
  return mount(DatasetBulkActions, {
    propsData: {
      selectedDatasets,
      areAllDatasetsSelected: allSelected
    },
    mocks: {
      $modal,
      $t,
      $store,
      backboneViews: {
        backgroundPollingView: {
          getBackgroundPollingView () {
            return { _addDataset };
          }
        },
        mamufasImportView: {
          getView () {
            return {};
          }
        }
      }
    },
    computed: {
      isAnyShared: () => isAnyShared
    }
  });
}
