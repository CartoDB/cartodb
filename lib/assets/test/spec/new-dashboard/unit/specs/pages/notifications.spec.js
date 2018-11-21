import { mount } from '@vue/test-utils';
import NotificationsPage from 'new-dashboard/components/NotificationCard';

describe.only('NotificationsPage.vue', () => {
  let notificationsPageWrapper;
  beforeEach(() => {
    notificationsPageWrapper = mount(NotificationsPage);
  });
  it('should display the page title', () => {
    const title = notificationsPageWrapper.find('.head-sectionTitle is-txtGrey');

    expect(title.exists()).toBe(true);
    expect(title.text()).toEqual('Notifications');
  });

  it('should show a message when there are no notifications', () => {
    const mainContent = notificationsPageWrapper.find('.main');

    expect(mainContent.text()).toBe('There are no notifications yet');
  });
});
