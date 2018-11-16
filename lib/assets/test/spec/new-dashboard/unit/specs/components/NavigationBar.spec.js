import { mount } from '@vue/test-utils';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

describe('NavigationBar.vue', () => {
  let user;
  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com'
    };
  });

  it('should render regular navbar with user dropdown closed', () => {
    const navigationBar = mount(NavigationBar, {
      propsData: {
        user
      }
    });
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown open', () => {
    const navigationBar = mount(NavigationBar, {
      propsData: {
        user: {}
      }
    });
    navigationBar.vm.toggleDropdown();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with search input open', () => {
    const navigationBar = mount(NavigationBar, {
      propsData: {
        user: {}
      }
    });
    navigationBar.vm.toggleSearch();
    expect(navigationBar).toMatchSnapshot();
  });

  it('should render regular navbar with user dropdown close after having opened it', () => {
    const navigationBar = mount(NavigationBar, {
      propsData: {
        user: {}
      }
    });
    navigationBar.vm.toggleDropdown();
    navigationBar.vm.closeDropdown();
    expect(navigationBar).toMatchSnapshot();
  });
});
