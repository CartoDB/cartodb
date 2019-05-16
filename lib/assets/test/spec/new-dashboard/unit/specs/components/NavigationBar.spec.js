import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

const $t = key => key;
const localVue = createLocalVue();
localVue.use(Vuex);

describe('NavigationBar.vue', () => {
  let user, navigationBar;

  const $store = {
    getters: {
      'user/isNotificationVisible': false
    }
  };

  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com'
    };

    navigationBar = shallowMount(NavigationBar, {
      propsData: {
        user
      },
      localVue,
      mocks: {
        $t,
        $store
      }
    });
  });

  it('should render regular navbar with user dropdown closed', () => {
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown open', () => {
    navigationBar.vm.toggleDropdown();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with search input open', () => {
    navigationBar.vm.toggleSearch();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown close after having opened it', () => {
    navigationBar.vm.toggleDropdown();
    navigationBar.vm.closeDropdown();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should have is-user-notification class when the user has a notification', () => {
    const $store = {
      getters: {
        'user/isNotificationVisible': true
      }
    };

    navigationBar = shallowMount(NavigationBar, {
      propsData: { user },
      mocks: {
        $store
      },
      localVue
    });

    expect(NavigationBar).toMatchSnapshot();
  });
});
