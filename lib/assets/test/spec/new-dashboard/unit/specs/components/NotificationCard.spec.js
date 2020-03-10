import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import NotificationCard from 'new-dashboard/components/NotificationCard';
import mockNotifications from '../fixtures/notifications';

describe('NotificationCard.vue', () => {
  let notifications, notificationCardWrapper;
  beforeEach(() => {
    notifications = mockNotifications;
    notificationCardWrapper = mount(NotificationCard, {
      computed: {
        receivedAtFormatted: () => '20/11/2018'
      }
    });
  });

  describe('basic behaviour', () => {
    it('should render the body', async () => {
      notificationCardWrapper.setProps({
        htmlBody: notifications[0].html_body
      });

      await nextTick();

      expect(notificationCardWrapper).toMatchSnapshot();
    });

    it('should render the date properly formatted', async () => {
      notificationCardWrapper.setProps({
        receivedAt: notifications[0].received_at
      });

      await nextTick();

      expect(notificationCardWrapper).toMatchSnapshot();
    });

    it('should hide the green dot when the notification has been read', async () => {
      notificationCardWrapper.setProps({
        readAt: notifications[1].read_at
      });

      await nextTick();

      expect(notificationCardWrapper).toMatchSnapshot();
    });

    it('should show the green dot dot when the notification has not been read', async () => {
      notificationCardWrapper.setProps({
        readAt: notifications[0].read_at
      });

      await nextTick();

      expect(notificationCardWrapper).toMatchSnapshot();
    });
  });
});
