import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';

const localVue = createLocalVue();
localVue.use(Vuex);

const $store = {
  dispatch: jest.fn()
};

describe('VisualizationsTitle.vue', () => {
  it('should show default title', () => {
    const propsData = {
      defaultTitle: 'Your Maps'
    };
    const visualizationsTitle = createVisualizationsTitle(propsData);

    expect(visualizationsTitle.vm.pageTitle).toBe(`Your Maps`);
  });
});

it('should replace title for items number when selecting maps', () => {
  const propsData = {
    defaultTitle: 'Your Maps'
  };
  const visualizationsTitle = createVisualizationsTitle(propsData);

  expect(visualizationsTitle.vm.pageTitle).toBe(`Your Maps`);

  const propsDataSelected = {
    selectedItems: 2,
    defaultTitle: 'Your Maps'
  };

  const visualizationsTitleSelected = createVisualizationsTitle(propsDataSelected);

  expect(visualizationsTitleSelected.vm.pageTitle).toBe('BulkActions.selected');
});

function createVisualizationsTitle (propsData) {
  return shallowMount(VisualizationsTitle, {
    mocks: {
      $t: key => key,
      $store
    },
    localVue,
    propsData
  });
}
