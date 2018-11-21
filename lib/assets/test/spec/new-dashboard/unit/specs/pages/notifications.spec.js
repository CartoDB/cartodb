import { mount } from '@vue/test-utils';
import NotificationsPage from 'new-dashboard/pages/Notifications';
import fakeNotifications from '../__mocks__/notifications.mock';

describe('NotificationsPage.vue', () => {
  let notificationsPageWrapper;

  describe('when there are notifications', () => {
    beforeEach(() => {
      notificationsPageWrapper = mount(NotificationsPage, {
        computed: {
          pageTitle: () => 'Notifications',
          notifications: () => fakeNotifications,
          hasNotifications: () => true,
          emptyStateText: () => 'There are no notifications.'
        }
      });
    });

    it('should show the page title', () => {
      const title = notificationsPageWrapper.find('.head-sectionTitle.is-txtGrey');
      expect(title.text()).toBe('Notifications');
    });

    it('should show the nofications list', () => {
      const notificationList = notificationsPageWrapper.find('.notifications-list');
      expect(notificationList.exists()).toBe(true);
    });

    it('should hide the no notifications message', () => {
      const notificationList = notificationsPageWrapper.find('.empty-state');
      expect(notificationList.exists()).toBe(false);
    });
  });

  describe('when there are no notifications', () => {
    beforeEach(() => {
      notificationsPageWrapper = mount(NotificationsPage, {
        computed: {
          pageTitle: () => 'Notifications',
          notifications: () => [],
          hasNotifications: () => false,
          emptyStateText: () => 'There are no notifications.'
        }
      });
    });

    it('should show the page title', () => {
      const title = notificationsPageWrapper.find('.head-sectionTitle.is-txtGrey');
      expect(title.text()).toBe('Notifications');
    });

    it('should hide the nofications list', () => {
      const notificationList = notificationsPageWrapper.find('.notifications-list');
      expect(notificationList.exists()).toBe(false);
    });

    it('should show the no notifications message', () => {
      const notificationList = notificationsPageWrapper.find('.empty-state');
      expect(notificationList.exists()).toBe(true);
    });
  });
});
