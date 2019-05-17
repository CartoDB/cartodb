import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Page from 'new-dashboard/components/Page';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('NavigationBar.vue', () => {
  it('should have is-user-notification class when the user has a notification', () => {
    const $store = {
      getters: {
        'user/isNotificationVisible': true
      }
    };

    const page = shallowMount(Page, {
      mocks: {
        $store
      },
      localVue
    });

    expect(page).toMatchSnapshot();
  });

  it('should not have is-user-notification class when the user has a notification', () => {
    const $store = {
      getters: {
        'user/isNotificationVisible': false
      }
    };

    const page = shallowMount(Page, {
      mocks: {
        $store
      },
      localVue
    });

    expect(page).toMatchSnapshot();
  });
});
