import {
  mount
} from '@vue/test-utils';
import NotificationCard from 'new-dashboard/components/NotificationCard';
import mockNotifications from '../__mocks__/notifications.mock';

describe.only('NotificationCard.vue', () => {
  let notifications, notificationCardWrapper;
  beforeEach(() => {
    notifications = mockNotifications;
    notificationCardWrapper = mount(NotificationCard);
  });
  describe('basic behaviour', () => {
    it('should render the body', () => {
      notificationCardWrapper.setProps({
        htmlBody: notifications[0].html_body
      });
      const htmlBodyElement = notificationCardWrapper.find('.notification-html');

      expect(htmlBodyElement.html()).toBe('<div class="notification-html text is-caption is-unread"><p>Im an unread notification, I have bold text and a green dot on top.</p></div>');
    });

    it('should render the date properly formatted', () => {
      notificationCardWrapper.setProps({
        receivedAt: notifications[0].received_at
      });
      const dateElement = notificationCardWrapper.find('.notification-received');

      expect(dateElement.text()).toBe('20/11/2018');
    });

    it('should hide the green dot when the notification has been read', () => {
      notificationCardWrapper.setProps({
        readAt: notifications[1].read_at
      });

      expect(notificationCardWrapper.findAll('.notification-read').exists()).toBe(false);
    });

    it('should show the green dot dot when the notification has not been read', () => {
      notificationCardWrapper.setProps({
        readAt: notifications[0].read_at
      });

      expect(notificationCardWrapper.findAll('.notification-read').exists()).toBe(true);
    });
  });
});
