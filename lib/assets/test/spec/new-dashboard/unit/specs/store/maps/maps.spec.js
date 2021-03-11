import visualization from '../../fixtures/visualizations';
import MapsStore from 'new-dashboard/store/modules/maps/carto';
import toObject from 'new-dashboard/utils/to-object';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = MapsStore.mutations;
const actions = MapsStore.actions;

describe('MapsStore', () => {
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
          total_entries: 24
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 2,
        resultsPerPage: 12,
        metadata: {
          total_entries: 24
        }
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

    describe('setResultsPerPage', () => {
      let state;
      beforeEach(() => {
        state = { resultsPerPage: 0 };
      });
      it('should update the "resultsPerPage" variable in the state with the given value', () => {
        mutations.setResultsPerPage(state, 2);
        expect(state.resultsPerPage).toEqual(2);
      });

      it('should update the "resultsPerPage" variable in the state with the default value when no value is given', () => {
        mutations.setResultsPerPage(state);
        expect(state.resultsPerPage).toEqual(12);
      });
    });

    describe('setOrder', () => {
      let state;
      beforeEach(() => {
        state = { order: '', orderDirection: '' };
      });

      it('should update the "order" variable in the state with the given value', () => {
        mutations.setOrder(state, {order: 'updated_at'});
        expect(state.order).toEqual('updated_at');
      });

      it('should update the "orderDirection" variable in the state with the default value', () => {
        mutations.setOrder(state, {order: 'updated_at'});
        expect(state.orderDirection).toEqual('desc,desc');
      });

      it('should update the "orderDirection" variable in the state with the given value', () => {
        mutations.setOrder(state, {direction: 'asc'});
        expect(state.orderDirection).toEqual('asc');
      });

      it('should update the "order" variable in the state with the default value', () => {
        mutations.setOrder(state, {direction: 'asc'});
        expect(state.order).toEqual('favorited,updated_at');
      });

      it('should update the "order" and "orderDirection" variable in the state with the default values', () => {
        mutations.setOrder(state, {direction: undefined, order: undefined});
        expect(state.order).toEqual('favorited,updated_at');
        expect(state.orderDirection).toEqual('desc,desc');
      });
    });
  });

  describe('actions', () => {
    describe('fetch', () => {
      let state;

      beforeEach(() => {
        state = {
          isFetching: false,
          isFiltered: false,
          isErrored: false,
          error: {},
          filterType: '',
          list: {},
          metadata: {},
          page: 1,
          numPages: 1,
          order: 'updated_at'
        };
      });

      it('success', done => {
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setVisualizations', payload: visualization },
          { type: 'setPagination', payload: state.page }
        ];

        const getVisualization = (_1, _2, callback) => callback(null, null, visualization);
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
      const filter = 'shared';
      const expectedMutations = [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: { filter } }
      ];
      const expectedActions = [{ type: 'fetch' }];
      testAction({ action: actions.filter, payload: { filter }, expectedMutations, expectedActions, done });
    });

    it('order', done => {
      const order = '-updated_at';
      const expectedMutations = [
        { type: 'setPagination', payload: 1 },
        { type: 'setOrder', payload: { order } }
      ];
      const expectedActions = [{ type: 'fetch' }];
      testAction({ action: actions.order, payload: { order }, expectedMutations, expectedActions, done });
    });

    it('resetFilters', done => {
      const expectedMutations = [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: 'mine' },
        { type: 'setResultsPerPage', payload: 12 },
        { type: 'setOrder', payload: { order: 'favorited,updated_at', direction: 'desc,desc' } }
      ];
      testAction({ action: actions.resetFilters, expectedMutations, done });
    });

    it('setURLOptions', done => {
      const URLOptions = { filter: 'mine', page: 2 };
      const expectedMutations = [
        { type: 'setPagination', 'payload': 2 },
        { type: 'setFilterType', 'payload': 'mine' },
        { type: 'setOrder', 'payload': { 'direction': undefined, 'order': undefined } },
        { type: 'setResultsPerPage' },
        { type: 'setQueryFilter' }
      ];
      const expectedActions = [{ type: 'fetch' }];

      testAction({ action: actions.setURLOptions, payload: URLOptions, expectedMutations, expectedActions, done });
    });

    describe('like', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(visualization.visualizations, 'id')
        };
      });

      it('success', done => {
        const visualizationId = 'e97e0001-f1c2-425e-8c9b-0fb28da59200';

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

        testAction({ action: actions.like, payload: state.list[visualizationId], state, expectedMutations, expectedActions, rootState, done });
      });

      it('errored', done => {
        const visualizationIdErr = '8b378bf8-e74d-4187-9e57-4249db4c0f1f';
        const currentLikeStatus = state.list[visualizationIdErr].liked;
        const expectedActions = [
          { type: 'updateVisualization', payload: { visualizationId: visualizationIdErr, visualizationAttributes: { liked: true } } },
          { type: 'updateVisualization', payload: { visualizationId: visualizationIdErr, visualizationAttributes: { liked: currentLikeStatus } } }
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

    describe('deleteLike', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(visualization.visualizations, 'id')
        };
      });
      it('success', done => {
        const visualizationId = '8b378bf8-e74d-4187-9e57-4249db4c0f1f';

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

        testAction({ action: actions.deleteLike, payload: state.list[visualizationId], state, expectedActions, expectedMutations, rootState, done });
      });
    });
  });
});
