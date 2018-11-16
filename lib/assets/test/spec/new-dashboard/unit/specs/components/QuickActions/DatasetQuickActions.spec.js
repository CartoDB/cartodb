import Vuex from 'vuex';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import DatasetQuickActions from 'new-dashboard/components/QuickActions/DatasetQuickActions';
import datasets from '../../fixtures/datasets';
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

let store = new Vuex.Store({
  state: {
    user: {
      organization: { id: 'fake-organization-id' }
    }
  }
});

const addDatasetSpy = jest.fn();
const backgroundPollingView = {
  getBackgroundPollingView () {
    return { _addDataset: addDatasetSpy };
  }
};

describe('DatasetQuickAction.vue', () => {
  it('should render correct contents', () => {
    const dataset = datasets.visualizations[0];
    const datasetQuickAction = createDatasetQuickActionComponent(dataset);
    datasetQuickAction.setData({ isOpen: true });

    expect(datasetQuickAction).toMatchSnapshot();
  });

  it('should not render the component if the map is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
    const dataset = datasets.visualizations[0];
    const datasetQuickAction = createDatasetQuickActionComponent(dataset);

    expect(datasetQuickAction).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "locked" action name when a map is locked', () => {
      const dataset = {...datasets.visualizations[0]};
      dataset.locked = true;
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);

      const result = datasetQuickAction.vm.actionMode;

      expect(result).toBe('locked');
    });

    it('should return "mine" action name when a map is not locked', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);

      const result = datasetQuickAction.vm.actionMode;

      expect(result).toBe('mine');
    });
  });

  describe('methods', () => {
    it('should call the function to show modal', () => {
      const dataset = datasets.visualizations[0];
      const $modal = { show: jest.fn() };
      const datasetQuickAction = createDatasetQuickActionComponent(dataset, { $modal });

      datasetQuickAction.vm.showModal();

      expect($modal.show).toHaveBeenCalled();
    });

    it('should emit event open when calling openQuickactions method', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      expect(datasetQuickAction.emitted('open')).toBeFalsy();

      datasetQuickAction.vm.openQuickactions();

      expect(datasetQuickAction.emitted('open').length).toBe(1);
    });

    it('should emit event close when calling closeQuickactions method', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      expect(datasetQuickAction.emitted('close')).toBeFalsy();

      datasetQuickAction.vm.closeQuickactions();

      expect(datasetQuickAction.emitted('close').length).toBe(1);
    });

    it('should open edit metadata modal', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.editInfo();

      expect(DialogActions.editDatasetMetadata).toHaveBeenCalled();
    });

    it('should open change privacy modal', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.changePrivacy();

      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open manage tags modal', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.manageTags();

      expect(DialogActions.editDatasetMetadata).toHaveBeenCalled();
    });

    it('should launch share with colleagues action', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.shareVisualization();

      expect(DialogActions.shareVisualization).toHaveBeenCalled();
    });

    it('should launch duplicate dataset action', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.duplicateDataset();

      expect(addDatasetSpy).toHaveBeenCalled();
    });

    it('should launch unlock dataset action', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.unlockDataset();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch lock dataset action', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.lockDataset();

      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch delete dataset action', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.deleteDataset();

      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });
  });
});

function createDatasetQuickActionComponent (dataset, additionalMocks) {
  return shallowMount(DatasetQuickActions, {
    store,
    localVue,
    propsData: { dataset, hasShadow: false },
    mocks: {
      $cartoModels,
      $t,
      ...additionalMocks,
      backboneViews: {
        backgroundPollingView
      }
    }
  });
}
