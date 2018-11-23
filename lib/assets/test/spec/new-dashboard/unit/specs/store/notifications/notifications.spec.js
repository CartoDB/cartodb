import { testAction } from '../helpers';
import notificationsStore from 'new-dashboard/store/notifications';

const noop = jest.fn();

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

  describe.only('actions', () => {
    let rootState;
    beforeEach(() => {
      rootState = {
        client: {
          getConfig: callback => callback(null, null, {
            organization_notifications: ['fake_notification']
          })
        }
      };
    });
    describe('.fetchNotifications', () => {
      describe('when the request is succesful', () => {
        it('should update the state with the given notifications and mark notifications as read', () => {
          const store = notificationsStore;
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

          testAction(action, actionPayload, state, expectedMutations, expectedActions, noop, rootState);
        });
      });

      describe('when the request fails', () => {
        const dummyError = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
        beforeEach(() => {
          rootState = {
            client: {
              getConfig: callback => callback(dummyError)
            }
          };
        });

        it('should update the state with the given notifications and mark notifications as read', () => {
          const store = notificationsStore;
          const action = store.actions.fetchNotifications;
          const state = {};
          const actionPayload = null;
          const expectedMutations = [{
            'type': 'setFetchingState'
          }, {
            'payload': dummyError,
            'type': 'setRequestError'
          }];
          const expectedActions = [];

          testAction(action, actionPayload, state, expectedMutations, expectedActions, noop, rootState);
        });
      });
    });

    describe('.markNotificationsAsRead', () => {
      let store, action, state, actionPayload;
      beforeEach(() => {
        rootState.client.updateNotification = jest.fn();
        store = notificationsStore;
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
        testAction(action, actionPayload, state, [], [], noop, rootState);
        expect(rootState.client.updateNotification).toHaveBeenCalledWith('fake_user_id', 'fake_api_key', {
          'id': 'fake_id_1',
          'read_at': expect.any(String)
        });
      });

      it('should not modify state notifications', () => {
        testAction(action, actionPayload, state, [], [], noop, rootState);
        expect(state.notifications[1].read_at).toBeNull();
      });
    });
  });
});
