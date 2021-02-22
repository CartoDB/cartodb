import datasets from '../../fixtures/datasets';
import DatasetsStore from 'new-dashboard/store/modules/data/datasets';
import toObject from 'new-dashboard/utils/to-object';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = DatasetsStore.mutations;
const actions = DatasetsStore.actions;

describe('DatasetsStore', () => {
  describe('mutations', () => {
    it('setRequestError', () => {
      let state = {
        isFetching: false,
        isErrored: false,
        error: {}
      };

      let err = { status: 404 };
      mutations.setRequestError(state, err);

      expect(state).toEqual({
        isFetching: false,
        isErrored: true,
        error: err
      });
    });

    it('setVisualizations', () => {
      let state = {
        list: {},
        metadata: {},
        isFetching: true
      };

      mutations.setVisualizations(state, datasets);

      expect(state).toEqual({
        list: toObject(datasets.visualizations, 'id'),
        metadata: {
          total_entries: datasets.total_entries,
          total_likes: datasets.total_likes,
          total_shared: datasets.total_shared,
          total_user_entries: datasets.total_user_entries
        },
        isFetching: false
      });
    });

    it('setFetchingState', () => {
      let state = {
        isFetching: false,
        isErrored: false,
        error: {}
      };

      mutations.setFetchingState(state);

      expect(state).toEqual({
        isFetching: true,
        isErrored: false,
        error: {}
      });
    });

    it('setPagination', () => {
      let state = {
        page: 1,
        numPages: 1,
        resultsPerPage: 12,
        metadata: {
          total_entries: 25
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 3,
        resultsPerPage: 12,
        metadata: {
          total_entries: 25
        }
      });
    });

    it('setFilterType', () => {
      const state = {
        filterType: 'mine'
      };

      mutations.setFilterType(state, 'favorited');

      expect(state).toEqual({
        filterType: 'favorited'
      });
    });

    it('setOrder', () => {
      const state = {
        order: 'updated_at',
        orderDirection: 'asc'
      };

      mutations.setOrder(state, { order: 'views', direction: 'asc' });

      expect(state).toEqual({
        order: 'views',
        orderDirection: 'asc'
      });
    });

    it('setResultsPerPage', () => {
      const state = {
        resultsPerPage: 6
      };

      mutations.setResultsPerPage(state, 12);

      expect(state).toEqual({
        resultsPerPage: 12
      });
    });

    it('updateNumberLikes: adds one to the total likes metadata count and changes map property liked to true', () => {
      let state = {
        metadata: {
          total_likes: 0
        }
      };

      mutations.updateNumberLikes(state, {
        visualizationId: 'xxxx-yyyy-zzzzz',
        visualizationAttributes: {
          liked: true
        }
      });

      expect(state).toEqual({
        metadata: {
          total_likes: 1
        }
      });
    });

    it('updateNumberLikes: substracts one to the total likes metadata count and changes map property liked to false', () => {
      let state = {
        metadata: {
          total_likes: 1
        }
      };

      mutations.updateNumberLikes(state, {
        visualizationId: 'xxxx-yyyy-zzzzz',
        visualizationAttributes: {
          liked: false
        }
      });

      expect(state).toEqual({
        metadata: {
          total_likes: 0
        }
      });
    });
  });

  describe('actions', () => {
    describe('fetchDatasets', () => {
      let state;
      beforeEach(() => {
        state = {
          isFetching: false,
          isFiltered: false,
          isErrored: false,
          error: {},
          filterType: 'mine',
          order: 'updated_at',
          list: {},
          metadata: {},
          page: 1,
          numPages: 1
        };
      });

      it('success', done => {
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setVisualizations', payload: datasets },
          { type: 'setPagination', payload: state.page }
        ];

        const getVisualization = (_1, _2, callback) => callback(null, null, datasets);
        const rootState = {
          client: { getVisualization }
        };

        testAction({ action: actions.fetch, state, expectedMutations, rootState, done });
      });

      it('errored', done => {
        state.order = false;
        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };

        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ];

        const getVisualization = (_1, _2, callback) => callback(err, null, null);
        const rootState = {
          client: { getVisualization }
        };

        testAction({ action: actions.fetch, state, expectedMutations, rootState, done });
      });
    });

    it('filter', done => {
      const filter = 'favorited';

      const expectedMutations = [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: 'favorited' }
      ];

      const expectedActions = [{ type: 'fetch' }];

      testAction({ action: actions.filter, payload: filter, expectedActions, expectedMutations, done });
    });

    it('order', done => {
      const order = 'views';

      const expectedMutations = [
        { type: 'setPagination', payload: 1 },
        { type: 'setOrder', payload: 'views' }
      ];

      const expectedActions = [{ type: 'fetch' }];

      testAction({ action: actions.order, payload: order, expectedActions, expectedMutations, done });
    });

    it('setURLOptions', done => {
      const URLOptions = {
        filter: 'favorited',
        page: 2,
        order: 'updated_at',
        order_direction: 'asc'
      };

      const expectedMutations = [
        { type: 'setPagination', payload: 2 },
        { type: 'setFilterType', payload: 'favorited' },
        { type: 'setOrder', payload: { order: 'updated_at', direction: 'asc' } },
        { type: 'setResultsPerPage' },
        { type: 'setQueryFilter' }
      ];

      const expectedActions = [{ type: 'fetch' }];

      testAction({ action: actions.setURLOptions, payload: URLOptions, expectedActions, expectedMutations, done });
    });

    it('setResultsPerPage', done => {
      const resultsPerPage = 6;

      const expectedMutations = [
        { type: 'setResultsPerPage', payload: 6 }
      ];

      testAction({ action: actions.setResultsPerPage, payload: resultsPerPage, expectedMutations, done });
    });

    describe('resetFilters', () => {
      it('should reset filters and fetch datasets', done => {
        const expectedMutations = [
          { type: 'setPagination', payload: 1 },
          { type: 'setFilterType', payload: 'mine' },
          { type: 'setResultsPerPage', payload: 12 },
          { type: 'setOrder', payload: { direction: 'desc,desc', order: 'favorited,updated_at' } }
        ];

        testAction({ action: actions.resetFilters, expectedMutations, done });
      });
    });

    describe('like', () => {
      let state;
      beforeEach(() => {
        state = {
          metadata: {
            total_likes: datasets.total_likes
          },
          list: toObject(datasets.visualizations, 'id')
        };
      });
      it('success', done => {
        const visualizationId = '8b2fa51d-618c-48ea-8c4c-4aa5e9a93a90';

        const expectedActions = [
          { type: 'updateVisualization',
            payload: {
              visualizationId,
              visualizationAttributes: {
                liked: true
              }
            }
          }
        ];

        const expectedMutations = [
          { type: 'updateNumberLikes',
            payload: {
              visualizationId,
              visualizationAttributes: {
                liked: true
              }
            }
          }
        ];

        const likeResponse = { id: visualizationId, liked: true };
        const like = (_, callback) => callback(null, null, likeResponse);
        const rootState = {
          client: { like }
        };

        testAction({ action: actions.like, payload: state.list[visualizationId], state, expectedActions, expectedMutations, rootState, done });
      });

      it('errored', done => {
        const visualizationIdErr = 'ba8b2bc3-a105-4640-b258-286fcf6f3050';
        const currentLikeStatus = state.list[visualizationIdErr].liked;

        const expectedActions = [
          { type: 'updateVisualization',
            payload: {
              visualizationId: visualizationIdErr,
              visualizationAttributes: {
                liked: true
              }
            }
          },
          { type: 'updateVisualization',
            payload: {
              visualizationId: visualizationIdErr,
              visualizationAttributes: {
                liked: currentLikeStatus
              }
            }
          }
        ];

        const likeResponse = { id: visualizationIdErr, liked: true };
        const errResponse = "You've already liked this visualization";
        const like = (_, callback) => callback(errResponse, null, likeResponse);
        const rootState = {
          client: { like }
        };

        testAction({ action: actions.like, payload: state.list[visualizationIdErr], state, expectedActions, rootState, done });
      });
    });

    describe('deleteLikeDataset', () => {
      let state;

      beforeEach(() => {
        state = {
          list: toObject(datasets.visualizations, 'id'),
          metadata: {
            total_likes: datasets.total_likes
          }
        };
      });

      it('success', done => {
        const visualizationId = 'ba8b2bc3-a105-4640-b258-286fcf6f3050';
        const expectedActions = [
          { type: 'updateVisualization',
            payload: {
              visualizationId,
              visualizationAttributes: {
                liked: false
              }
            }
          }
        ];

        const expectedMutations = [
          { type: 'updateNumberLikes',
            payload: {
              visualizationId,
              visualizationAttributes: {
                liked: false
              }
            }
          }
        ];

        const deleteLikeResponse = { id: visualizationId, liked: false };
        const deleteLike = (_, callback) => callback(null, null, deleteLikeResponse);
        const rootState = {
          client: { deleteLike }
        };

        testAction({ action: actions.deleteLike, payload: state.list[visualizationId], state, expectedMutations, expectedActions, rootState, done });
      });
    });
  });
});
