import {
  mount,
  createLocalVue
} from '@vue/test-utils';
import NotificationsPage from 'new-dashboard/pages/Notifications';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
const $t = key => key;

const notificationsMock = [{
  html_body: '<p>Cupcake Ipsum dolor gingerbread chocolate. <em>Pudding</em> wafer ice cream. Powder ice cream carrot cake <strong>liquorice</strong> cookie oat cake.</p>',
  icon: 'alert',
  id: '288dfe6e-1a9d-4157-bd36-41cd8459af62',
  read_at: null,
  received_at: '2018-11-20T15:28:21.792Z'
},
{
  html_body: '<p>Holi parte 2</p>',
  icon: 'alert',
  id: '091a04a7-28d6-4fcf-bd8a-b1c34842bdb4',
  read_at: null,
  received_at: '2018-11-19T17:11:42.285Z'
}
];

describe('NotificationsPage.vue', () => {
  let notificationsPageWrapper;
  describe('when there are notifications', () => {
    beforeEach(() => {
      store = new Vuex.Store({
        state: {
          user: {
            organizationNotifications: [notificationsMock]
          }
        }
      });
      notificationsPageWrapper = mount(NotificationsPage, {
        store,
        localVue,
        mocks: {
          $t
        }
      });
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
      store = new Vuex.Store({
        state: {
          user: {
            organizationNotifications: []
          }
        }
      });
      notificationsPageWrapper = mount(NotificationsPage, {
        store,
        localVue,
        mocks: {
          $t
        }
      });
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
