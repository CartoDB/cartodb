import NotificationsFactory from 'new-dashboard/store/notifications/NotificationsFactory';

import { testAction } from '../helpers';

describe('notificationsStore', () => {
  describe('mutations', () => {
    let state;
    let store;
    beforeEach(() => {
      store = NotificationsFactory.create();
      state = {
        notifications: ['fake_notifications_initial']
      };
    });

    describe('.setNotifications', () => {
      it('should update the state with the new notification list', () => {
        store.mutations.setNotifications(state, ['fake_notification']);

        expect(state.notifications).toEqual(['fake_notification']);
        expect(state.isFetching).toEqual(false);
        expect(state.isErrored).toEqual(false);
        expect(state.error).toEqual([]);
      });
    });

    describe('.setRequestError', () => {
      it('should update state with the new error list', () => {
        store.mutations.setRequestError(state, 'fake_error');

        expect(state.notifications).toEqual([]);
        expect(state.isFetching).toEqual(false);
        expect(state.isErrored).toEqual(true);
        expect(state.error).toEqual('fake_error');
      });
    });

    describe('.setFetchingState', () => {
      it('should update the state and mark it as fetching reseting the list and the erros', () => {
        store.mutations.setFetchingState(state);

        expect(state.notifications).toEqual([]);
        expect(state.isFetching).toEqual(true);
        expect(state.isErrored).toEqual(false);
        expect(state.error).toEqual([]);
      });
    });
  });

  describe('actions', () => {
    describe('.fetchNotifications', () => {
      describe('when the request is succesful', () => {
        it('should update the state with the given notifications and mark notifications as read', () => {
          const store = NotificationsFactory.create({
            getConfig: callback => callback(null, null, {
              organization_notification: ['fake_notifications']
            })
          });
          const action = store.actions.fetchNotifications;
          const state = {};
          const actionPayload = null;
          const expectedMutations = [{
            type: 'setFetchingState'
          }, {
            type: 'setNotifications'
          }];
          const expectedActions = [{
            type: 'markNotificationsAsRead',
            payload: null
          }];

          testAction(action, actionPayload, state, expectedMutations, expectedActions);
        });
      });

      describe('when the request fails', () => {
        it('should update the state with the given notifications and mark notifications as read', () => {
          const store = NotificationsFactory.create({
            getConfig: callback => callback('fake_error') // eslint-disable-line
          });
          const action = store.actions.fetchNotifications;
          const state = {};
          const actionPayload = null;
          const expectedMutations = [{
            'type': 'setFetchingState'
          }, {
            'payload': 'fake_error',
            'type': 'setRequestError'
          }];
          const expectedActions = [];

          testAction(action, actionPayload, state, expectedMutations, expectedActions);
        });
      });
    });

    describe('.markNotificationsAsRead', () => {
      let clientSpy, store, action, state, actionPayload;
      beforeEach(() => {
        clientSpy = {
          updateNotification: jest.fn()
        };
        store = NotificationsFactory.create(clientSpy);
        action = store.actions.markNotificationsAsRead;
        state = {
          notifications: [{
            id: 'fake_id_0',
            read_at: 1
          }, {
            id: 'fake_id_1',
            read_at: null
          }]
        };
        actionPayload = {
          userId: 'fake_user_id',
          apiKey: 'fake_api_key'
        };
      });
      it('should notify the server about read_at', () => {
        testAction(action, actionPayload, state, [], []);
        expect(clientSpy.updateNotification).toHaveBeenCalledWith('fake_user_id', 'fake_api_key', {
          'id': 'fake_id_1',
          'read_at': expect.any(String)
        });
      });

      it('should not modify state notifications', () => {
        testAction(action, actionPayload, state, [], []);
        expect(state.notifications[1].read_at).toBeNull();
      });
    });
  });
});
