import Vuex from 'vuex';
import { nextTick } from 'vue';
import { mount, createLocalVue } from '@vue/test-utils';
import DatasetQuickActions from 'new-dashboard/components/QuickActions/DatasetQuickActions';
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';
import datasets from '../../fixtures/datasets';
import datasetsShared from '../../fixtures/datasetsShared';
import datasetsLocked from '../../fixtures/datasetsLocked';

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
    }
  },
  actions: {
    'datasets/fetch': fetchDatasetsSpy
  }
});

const addDatasetSpy = jest.fn();
const backgroundPollingView = {
  getBackgroundPollingView () {
    return { _addDataset: addDatasetSpy };
  }
};

describe('DatasetQuickAction.vue', () => {
  it('should render open dropdown with all actions for non shared non locked datasets', async () => {
    const dataset = datasets.visualizations[0];
    const datasetQuickAction = createDatasetQuickActionComponent(dataset);
    const quickActionDropdown = datasetQuickAction.find(QuickActions);

    quickActionDropdown.setData({ isOpen: true });
    await nextTick();
    expect(quickActionDropdown).toMatchSnapshot();
  });

  it('should render open dropdown with actions for locked datasets', async () => {
    const dataset = datasetsLocked.visualizations[0];
    const datasetQuickAction = createDatasetQuickActionComponent(dataset);
    const quickActionDropdown = datasetQuickAction.find(QuickActions);

    quickActionDropdown.setData({ isOpen: true });
    await nextTick();
    expect(quickActionDropdown).toMatchSnapshot();
  });

  describe('computed', () => {
    it('should return "locked" action name when a map is locked', () => {
      const dataset = datasetsLocked.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);

      const result = datasetQuickAction.vm.actionMode;
      expect(result).toBe('locked');
    });

    it('should return "shared" action name when a map is shared', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);

      datasetQuickAction.setProps({ isSharedWithMe: true });
      await nextTick();
      const result = datasetQuickAction.vm.actionMode;
      expect(result).toBe('shared');
    });

    it('should return "mine" action name when a map is not locked or shared', () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      const result = datasetQuickAction.vm.actionMode;

      expect(result).toBe('mine');
    });
  });

  describe('methods', () => {
    it('should call the function to show modal', async () => {
      const dataset = datasets.visualizations[0];
      const $modal = { show: jest.fn() };
      const datasetQuickAction = createDatasetQuickActionComponent(dataset, { $modal });

      datasetQuickAction.vm.showModal();
      await nextTick();
      expect($modal.show).toHaveBeenCalled();
    });

    it('should emit event open when calling openQuickactions method', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      expect(datasetQuickAction.emitted('open')).toBeFalsy();

      datasetQuickAction.vm.openQuickactions();
      await nextTick();
      expect(datasetQuickAction.emitted('open').length).toBe(1);
    });

    it('should emit event close when calling closeQuickactions method', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      expect(datasetQuickAction.emitted('close')).toBeFalsy();

      datasetQuickAction.vm.closeQuickactions();
      await nextTick();
      expect(datasetQuickAction.emitted('close').length).toBe(1);
    });

    it('should open edit metadata modal', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.editInfo();
      await nextTick();
      expect(DialogActions.editDatasetMetadata).toHaveBeenCalled();
    });

    it('should open change privacy modal', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.changePrivacy();
      await nextTick();
      expect(DialogActions.changePrivacy).toHaveBeenCalled();
    });

    it('should open manage tags modal', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.manageTags();
      await nextTick();
      expect(DialogActions.editDatasetMetadata).toHaveBeenCalled();
    });

    it('should launch share with colleagues action', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.shareVisualization();
      await nextTick();
      expect(DialogActions.shareVisualization).toHaveBeenCalled();
    });

    it('should launch duplicate dataset action', async () => {
      const dataset = datasetsShared.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.duplicateDataset();
      await nextTick();
      expect(addDatasetSpy).toHaveBeenCalledWith(expect.objectContaining({
        value: dataset.table.name
      }));
    });

    it('should launch unlock dataset action', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.unlockDataset();
      await nextTick();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch lock dataset action', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.lockDataset();
      await nextTick();
      expect(DialogActions.changeLockState).toHaveBeenCalled();
    });

    it('should launch delete dataset action', async () => {
      const dataset = datasets.visualizations[0];
      const datasetQuickAction = createDatasetQuickActionComponent(dataset);
      datasetQuickAction.vm.closeDropdown = jest.fn();

      datasetQuickAction.vm.deleteDataset();
      await nextTick();
      expect(DialogActions.deleteVisualization).toHaveBeenCalled();
    });
  });

  describe('Action Handlers', () => {
    describe('fetchList', () => {
      it('should dispatch store actions and emit contentChanged event', async () => {
        const dataset = datasetsLocked.visualizations[0];
        const datasetQuickAction = createDatasetQuickActionComponent(dataset);
        const actionHandlers = datasetQuickAction.vm.getActionHandlers();

        actionHandlers.fetchList();
        await nextTick();
        expect(fetchDatasetsSpy).toHaveBeenCalled();
        expect(datasetQuickAction.emitted('contentChanged')).toBeTruthy();
      });
    });
  });
});

function createDatasetQuickActionComponent (dataset, additionalMocks) {
  return mount(DatasetQuickActions, {
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
