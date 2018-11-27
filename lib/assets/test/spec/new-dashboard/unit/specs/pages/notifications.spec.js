import { fakeStore } from './mocks';
import { mount } from '@vue/test-utils';
import fakeNotifications from '../fixtures/notifications';
import NotificationsPage from 'new-dashboard/pages/Notifications';

describe('NotificationsPage.vue', () => {
  let notificationsPageWrapper;
  describe('computed properties', () => {
    it('should be correctly binded to the store', () => {
      const $tSpy = jest.fn().mockReturnValue('fake_i18n_string');
      notificationsPageWrapper = mount(NotificationsPage, {
        mocks: {
          $store: fakeStore,
          $t: $tSpy
        }
      });

      expect(notificationsPageWrapper.vm.pageTitle).toEqual('fake_i18n_string');
      expect($tSpy).toHaveBeenCalledWith('NotificationsPage.header.title');
      expect(notificationsPageWrapper.vm.notifications).toEqual(['fake_notifications']);
      expect(notificationsPageWrapper.vm.emptyState).toBeFalsy();
      expect(notificationsPageWrapper.vm.emptyStateText).toBe('fake_i18n_string');
      expect($tSpy).toHaveBeenCalledWith('NotificationsPage.emptyState');
    });
  });

  describe('when there are notifications', () => {
    beforeEach(() => {
      notificationsPageWrapper = mount(NotificationsPage, {
        computed: {
          pageTitle: () => 'Notifications',
          notifications: () => fakeNotifications,
          emptyState: () => false,
          emptyStateText: () => 'There are no notifications.'
        },
        mocks: {
          $store: fakeStore
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
          emptyState: () => true,
          emptyStateText: () => 'There are no notifications.'
        },
        mocks: {
          $store: fakeStore
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
