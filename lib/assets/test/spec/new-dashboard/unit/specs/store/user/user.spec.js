import UserStore from 'new-dashboard/store/user';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = UserStore.mutations;
const actions = UserStore.actions;

describe('UserStore', () => {
  describe('mutations', () => {
    it('setUserData', () => {
      const state = {
        email: 'example@example.org',
        username: 'example',
        website: 'https://carto.com'
      };

      const userData = {
        email: 'example@carto.com',
        username: 'carto'
      };
      mutations.setUserData(state, userData);

      expect(state).toEqual({
        email: 'example@carto.com',
        username: 'carto',
        website: 'https://carto.com'
      });
    });
  });

  describe('actions', () => {
    describe('updateData', () => {
      let state;
      beforeEach(() => {
        state = {
          email: 'example@example.org',
          username: 'example',
          website: 'https://carto.com'
        };
      });

      it('success', done => {
        const newConfigData = {
          email: 'example@carto.com',
          username: 'carto'
        };

        testAction(actions.updateData, null, state, [
          { type: 'setUserData', payload: newConfigData }
        ], [], done);
      });
    });
  });
});
