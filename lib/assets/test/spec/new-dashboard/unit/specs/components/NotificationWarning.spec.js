import {
  mount
} from '@vue/test-utils';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';

describe('NotificationWarning.vue', () => {
  let notificationCardWrapper;

  beforeEach(() => {
    notificationCardWrapper = mount(NotificationWarning);
  });

  describe('basic behaviour', () => {
    it('should render the body', () => {
      notificationCardWrapper.setProps({
        htmlBody: 'Notification message'
      });
      expect(notificationCardWrapper).toMatchSnapshot();
    });
  });
});
