import { mount } from '@vue/test-utils';
import NotificationCard from 'new-dashboard/components/NotificationCard';

describe.only('NotificationCard.vue', () => {
  let notifications;
  beforeEach(() => {
    notifications = [{
      'id': '091a04a7-28d6-4fcf-bd8a-b1c34842bdb4',
      'icon': 'alert',
      'html_body': '<p>Test notification 1</p>\n',
      'received_at': '2018-11-19T17:11:42.285Z',
      'read_at': null
    },
    {
      'id': '091a04a7-28d6-4fcf-bd8a-b1c34842bdb2',
      'icon': 'alert',
      'html_body': '<p>Test notification 2/p>\n',
      'received_at': '2018-11-16T17:11:42.285Z',
      'read_at': '2018-11-16T19:15:42.285Z'
    }
    ];
  });
  describe('basic behaviour', () => {
    it('should render the origin ', () => {

    });

    it('should render the body', () => {

    });

    it('should render the date properly formatted', () => {
      const notificationCardWrapper = mount(NotificationCard);
      const dateElement = notificationCardWrapper.find('.notification-receivedDate');

      expect(dateElement.text()).toBe('19/11/2018');
    });

    it('should hide the green dot when the notification has been read', () => {});
    it('should show the green dot dot when the notification has not been read', () => {});
  });
});
