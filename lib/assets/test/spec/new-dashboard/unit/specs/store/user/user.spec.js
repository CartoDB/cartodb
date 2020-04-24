import UserStore from 'new-dashboard/store/modules/user';
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

    it('setOrganizationNotifications', () => {
      const state = {
        organizationNotifications: [{
          id: '3cbd8ee6-8f08-40c6-b58d-e49cb712c9e4',
          icon: 'alert',
          received_at: '2019-02-19T09:41:29.646Z'
        }]
      };

      mutations.setOrganizationNotifications(state, []);

      expect(state).toEqual({
        organizationNotifications: []
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
        const rootState = {
          client: {
            getConfig (callback) {
              callback(null, null, {
                user_data: {
                  email: 'example@carto.com',
                  username: 'carto'
                }
              });
            }
          }
        };

        const newConfigData = {
          email: 'example@carto.com',
          username: 'carto'
        };
        const expectedMutations = [
          { type: 'setUserData', payload: newConfigData }
        ];

        testAction({ action: actions.updateData, state, rootState, expectedMutations, done });
      });
    });

    it('resetOrganizationNotifications: should reset organization notifications', done => {
      const expectedMutations = [
        { type: 'setOrganizationNotifications', payload: [] }
      ];
      testAction({ action: actions.resetOrganizationNotifications, expectedMutations, done });
    });
  });
});
