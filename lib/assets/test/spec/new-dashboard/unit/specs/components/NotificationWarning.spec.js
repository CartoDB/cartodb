import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('NotificationWarning.vue', () => {
  let notificationWarning;

  const $store = {
    dispatch: jest.fn()
  };

  notificationWarning = shallowMount(NotificationWarning, {
    propsData: {
      htmlBody: 'Notification message'
    },
    localVue,
    mocks: {
      $store
    }
  });

  beforeEach(() => {
    notificationWarning.setProps({
      htmlBody: 'Notification message'
    });
  });

  describe('basic behaviour', () => {
    it('should render the body', () => {
      expect(notificationWarning).toMatchSnapshot();
    });

    it('should call the close method when clicking on close button', () => {
      notificationWarning.find('button.notification__close-button').trigger('click');

      expect($store.dispatch).toHaveBeenCalledWith('user/hideUserNotification');
    });
  });
});
