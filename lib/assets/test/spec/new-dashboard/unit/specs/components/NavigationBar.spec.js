import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('NavigationBar.vue', () => {
  let user, navigationBar;

  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com',
      feature_flags: ['dbdirect']
    };

    navigationBar = shallowMount(NavigationBar, {
      propsData: {
        user,
        isNotificationVisible: false
      },
      mocks: {
        $router: {
          resolve: href => href
        },
        $t: key => key
      },
      localVue
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
    navigationBar = shallowMount(NavigationBar, {
      propsData: {
        user,
        isNotificationVisible: true
      },
      mocks: {
        $router: {
          resolve: href => href
        },
        $t: key => key
      },
      localVue
    });

    expect(navigationBar).toMatchSnapshot();
  });
});
