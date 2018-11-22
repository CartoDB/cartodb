import NotificationsFactory from 'new-dashboard/store/notifications/NotificationsFactory';

import {
  testAction
} from '../helpers';

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
      beforeEach(() => {
        store.mutations.setNotifications(state, ['fake_notification']);
      });

      it('should update the state with the new list', () => {
        expect(state.notifications).toEqual(['fake_notification']);
      });

      it('should update the state.isFetching to false  ', () => {
        expect(state.isFetching).toEqual(false);
      });

      it('should update the state.isErrored to false  ', () => {
        expect(state.isErrored).toEqual(false);
      });

      it('should update the state reseting the error list', () => {
        expect(state.error).toEqual([]);
      });
    });

    describe('.setRequestError', () => {
      beforeEach(() => {
        store.mutations.setRequestError(state, 'fake_error');
      });

      it('should update the state reseting the list', () => {
        expect(state.notifications).toEqual([]);
      });
      it('should update the state.isFetching to false  ', () => {
        expect(state.isFetching).toEqual(false);
      });
      it('should update the state.isErrored to true  ', () => {
        expect(state.isErrored).toEqual(true);
      });
      it('should update the state with the new error list', () => {
        expect(state.error).toEqual('fake_error');
      });
    });

    describe('.setFetchingState', () => {
      beforeEach(() => {
        store.mutations.setFetchingState(state);
      });

      it('should update the state reseting the list', () => {
        expect(state.notifications).toEqual([]);
      });

      it('should update the state.isFetching to true  ', () => {
        expect(state.isFetching).toEqual(true);
      });

      it('should update the state.isErrored to false  ', () => {
        expect(state.isErrored).toEqual(false);
      });

      it('should update the state reseting the error list', () => {
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
        expect(clientSpy.updateNotification).toHaveBeenCalledWith('fake_user_id', 'fake_api_key', {'id': 'fake_id_1', 'read_at': expect.any(String)});
      });

      it('should not modify state notifications', () => {
        testAction(action, actionPayload, state, [], []);
        expect(state.notifications[1].read_at).toBeNull();
      });
    });
  });
});
