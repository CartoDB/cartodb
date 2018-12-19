import { mount } from '@vue/test-utils';
import UserDropdown from 'new-dashboard/components/NavigationBar/UserDropdown';

const $t = key => key;

describe('UserDropdown.vue', () => {
  let user;
  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png',
      username: 'Test user',
      email: 'user@test.com'
    };
  });

  it('should render dropdown open with notifications badge', () => {
    const userDropdown = mount(UserDropdown, {
      propsData: {
        userModel: user,
        notificationsCount: 2
      },
      mocks: { $t }
    });
    expect(userDropdown).toMatchSnapshot();
  });

  it('should render dropdown closed', () => {
    const userDropdown = mount(UserDropdown, {
      propsData: {
        open: true,
        userModel: user,
        notificationsCount: 0
      },
      mocks: { $t }
    });

    expect(userDropdown).toMatchSnapshot();
  });

  it('should render organization link if user is org_admin', () => {
    const overridenUser = {
      ...user,
      org_admin: true
    };

    const userDropdown = mount(UserDropdown, {
      propsData: {
        open: true,
        userModel: overridenUser,
        notificationsCount: 0
      },
      mocks: { $t }
    });

    expect(userDropdown).toMatchSnapshot();
  });
});
