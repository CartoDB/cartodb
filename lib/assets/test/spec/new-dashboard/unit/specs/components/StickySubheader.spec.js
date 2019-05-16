import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import StickySubheader from 'new-dashboard/components/StickySubheader';

const localVue = createLocalVue();
localVue.use(Vuex);

const $store = {
  getters: {
    'user/isNotificationVisible': false
  }
};

describe('StickySubheader.vue', () => {
  it('should render correct contents', () => {
    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: false },
      slots: {
        default: '<div class="default-slot"></div>'
      },
      mocks: {
        $store
      },
      localVue
    });
    expect(stickySubheader).toMatchSnapshot();
  });

  it('should have is-visible class when isVisible is true', () => {
    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: true },
      mocks: {
        $store
      },
      localVue
    });
    expect(stickySubheader).toMatchSnapshot();
  });

  it('should have is-user-notification class when the user has a notification', () => {
    $store.getters['user/isNotificationVisible'] = true;

    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: true },
      mocks: {
        $store
      },
      localVue
    });
    expect(stickySubheader).toMatchSnapshot();
  });
});
