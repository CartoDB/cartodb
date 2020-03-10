import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import { nextTick } from 'vue';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('NavigationBar.vue', () => {
  let user, navigationBar;

  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com'
    };

    navigationBar = shallowMount(NavigationBar, {
      propsData: {
        user,
        isNotificationVisible: false
      },
      localVue
    });
  });

  it('should render regular navbar with user dropdown closed', () => {
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown open', async () => {
    navigationBar.vm.toggleDropdown();
    await nextTick();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with search input open', async () => {
    navigationBar.vm.toggleSearch();
    await nextTick();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown close after having opened it', async () => {
    navigationBar.vm.toggleDropdown();
    await nextTick();
    navigationBar.vm.closeDropdown();
    await nextTick();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should have is-user-notification class when the user has a notification', () => {
    navigationBar = shallowMount(NavigationBar, {
      propsData: {
        user,
        isNotificationVisible: true
      },
      localVue
    });

    expect(NavigationBar).toMatchSnapshot();
  });
});
