import store from 'new-dashboard/store/notifications';

const mutations = store.mutations;

describe('notificationsStore', () => {
  describe('mutations', () => {
    let state;
    beforeEach(() => {
      state = {
        notifications: ['fake_notifications_initial']
      };
    });
    describe('.setNotifications', () => {
      beforeEach(() => {
        mutations.setNotifications(state, ['fake_notification']);
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
        mutations.setRequestError(state, 'fake_error');
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
        mutations.setFetchingState(state);
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

  xdescribe('actions', () => {
    describe('.fetchNotifications', () => {});
    describe('.markNotificationAsRead', () => {});
  });
});
