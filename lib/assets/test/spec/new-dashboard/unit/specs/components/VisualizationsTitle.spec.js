import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';

const localVue = createLocalVue();
localVue.use(Vuex);

const $store = {
  dispatch: jest.fn()
};

describe('VisualizationsTitle.vue', () => {
  it('should update title with limit counter when user has limits', () => {
    const propsData = {
      defaultTitle: 'Your Maps',
      vizQuota: 10,
      vizCount: 7,
      counterLabel: 'Public Maps',
      isOutOfQuota: false
    };
    const visualizationsTitle = createVisualizationsTitle(propsData);

    expect(visualizationsTitle.vm.pageTitle).toBe(`Your Maps (Public Maps 7/10)`);
  });
});

it('should not show limit counter when user has limits and has reached quota', () => {
  const propsData = {
    defaultTitle: 'Your Maps',
    vizQuota: 10,
    vizCount: 10,
    counterLabel: 'Public Maps',
    isOutOfQuota: true
  };
  const visualizationsTitle = createVisualizationsTitle(propsData);

  expect(visualizationsTitle.vm.pageTitle).toBe(`Your Maps`);
});

it('should replace title for items number when selecting maps', () => {
  const propsData = {
    defaultTitle: 'Your Maps',
    counterLabel: 'Public Maps'
  };
  const visualizationsTitle = createVisualizationsTitle(propsData);

  expect(visualizationsTitle.vm.pageTitle).toBe(`Your Maps`);

  const propsDataSelected = {
    selectedItems: 2,
    defaultTitle: 'Your Maps',
    counterLabel: 'Public Maps'
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
