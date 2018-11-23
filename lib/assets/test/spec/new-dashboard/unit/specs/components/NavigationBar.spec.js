import { mount } from '@vue/test-utils';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

const $t = key => key;

describe('NavigationBar.vue', () => {
  let user, navigationBar;

  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com'
    };

    navigationBar = mount(NavigationBar, {
      propsData: {
        user
      },
      mocks: { $t }
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
});
