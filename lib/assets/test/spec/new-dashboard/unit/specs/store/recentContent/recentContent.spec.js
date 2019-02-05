import RecentContentStore from 'new-dashboard/store/modules/recent-content';
import toObject from 'new-dashboard/utils/to-object';
import visualizations from '../../fixtures/visualizations';
import datasets from '../../fixtures/datasets';
import { testAction } from '../helpers';

const getters = RecentContentStore.getters;
const mutations = RecentContentStore.mutations;
const actions = RecentContentStore.actions;

const defaultState = {
  list: {},
  metadata: {},
  error: {},
  isFetching: false,
  isErrored: false
};

const recentContentList = [
  visualizations.visualizations[0],
  visualizations.visualizations[1],
  datasets.visualizations[0]
];

const recentContentResponse = {
  visualizations: recentContentList,
  total_entries: 3
};

describe('RecentContentStore', () => {
  describe('getters', () => {
    describe('hasRecentContent', () => {
      it('should return true if total_entries is greater than 0', () => {
        const state = {
          metadata: { total_entries: 1 }
        };

        expect(getters.hasRecentContent(state)).toBe(true);
      });
    });
  });

  describe('mutations', () => {
    it('setRecentContent', () => {
      const state = {
        ...defaultState,
        isFetching: true
      };

      mutations.setRecentContent(state, recentContentResponse);

      expect(state).toEqual({
        isFetching: false,
        isErrored: false,
        list: toObject(recentContentResponse.visualizations, 'id'),
        error: {},
        metadata: {
          total_entries: recentContentResponse.total_entries
        }
      });
    });

    it('setFetchingState', () => {
      const state = {
        isFetching: false
      };

      mutations.setFetchingState(state);

      expect(state).toEqual({
        isFetching: true,
        isErrored: false,
        error: {}
      });
    });

    it('setRequestError', () => {
      const state = {
        ...defaultState,
        isFetching: true
      };

      const err = { status: 404 };
      mutations.setRequestError(state, err);

      expect(state).toEqual({
        isFetching: false,
        isErrored: true,
        error: err,
        list: {},
        metadata: {}
      });
    });

    it('updateLike', () => {
      const state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: false
          }
        }
      };

      mutations.updateLike(state, { visualizationId: 'xxxx-yyyy-zzzzz', liked: true });

      expect(state).toEqual({
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: true
          }
        }
      });
    });

    it('updateNumberLikes', () => {
      const state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            likes: 0
          }
        }
      };

      mutations.updateNumberLikes(state, { visualizationId: 'xxxx-yyyy-zzzzz', likes: 1 });

      expect(state).toEqual({
        list: {
          'xxxx-yyyy-zzzzz': {
            likes: 1
          }
        }
      });
    });
  });

  describe('actions', () => {
    describe('like', () => {
      let state;
      beforeEach(() => {
        state = {
          ...defaultState,
          list: toObject(recentContentResponse.visualizations, 'id')
        };
      });

      it('success', done => {
        const visualizationId = 'e97e0001-f1c2-425e-8c9b-0fb28da59200';
        const expectedMutations = [
          { type: 'updateLike', payload: { visualizationId, liked: true } },
          { type: 'updateNumberLikes', payload: { visualizationId, likes: state.list[visualizationId].likes + 1 } }
        ];

        const likeResponse = { id: visualizationId, likes: 1, liked: true };
        const like = (_, callback) => callback(null, null, likeResponse);
        const rootState = {
          client: { like }
        };

        testAction({ action: actions.like, payload: state.list[visualizationId], state, expectedMutations, rootState, done });
      });

      it('errored', done => {
        const visualizationIdErr = 'e97e0001-f1c2-425e-8c9b-0fb28da59200';
        const currentLikeStatus = state.list[visualizationIdErr].liked;
        const expectedMutations = [
          { type: 'updateLike', payload: { visualizationId: visualizationIdErr, liked: true } },
          { type: 'updateLike', payload: { visualizationId: visualizationIdErr, liked: currentLikeStatus } }
        ];

        const likeResponse = { id: visualizationIdErr, likes: 1, liked: true };
        const errResponse = "You've already liked this visualization";
        const like = (_, callback) => callback(errResponse, null, likeResponse);
        const rootState = {
          client: { like }
        };

        testAction({ action: actions.like, payload: state.list[visualizationIdErr], state, expectedMutations, rootState, done });
      });
    });

    describe('deleteLike', () => {
      let state;
      beforeEach(() => {
        state = {
          ...defaultState,
          list: toObject(recentContentResponse.visualizations, 'id')
        };
      });

      it('success', done => {
        const visualizationId = '8b378bf8-e74d-4187-9e57-4249db4c0f1f';
        const expectedMutations = [
          { type: 'updateLike', payload: { visualizationId, liked: false } },
          { type: 'updateNumberLikes', payload: { visualizationId, likes: state.list[visualizationId].likes - 1 } }
        ];

        const deleteLikeResponse = { id: visualizationId, likes: 0, liked: true };
        const deleteLike = (_, callback) => callback(null, null, deleteLikeResponse);
        const rootState = {
          client: { deleteLike }
        };

        testAction({ action: actions.deleteLike, payload: state.list[visualizationId], state, expectedMutations, rootState, done });
      });
    });

    describe('fetchContent', () => {
      it('success', done => {
        const state = { ...defaultState };

        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setRecentContent', payload: recentContentResponse }
        ];

        const getVisualization = (_1, _2, callback) => callback(null, null, recentContentResponse);
        const rootState = {
          client: { getVisualization }
        };

        testAction({action: actions.fetchContent, state, expectedMutations, rootState, done});
      });

      it('errored', done => {
        const state = {
          ...defaultState,
          order: false
        };

        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ];

        const getVisualization = (_1, _2, callback) => callback(err, null, null);
        const rootState = {
          client: { getVisualization }
        };

        testAction({action: actions.fetchContent, state, expectedMutations, rootState, done});
      });
    });
  });
});
