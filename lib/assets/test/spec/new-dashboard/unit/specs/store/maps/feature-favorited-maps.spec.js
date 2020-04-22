import visualization from '../../fixtures/visualizations';
import datasets from '../../fixtures/datasets';
import FeaturedFavoritedMapsStore from 'new-dashboard/store/modules/maps/carto/featured-favorited-maps';
import toObject from 'new-dashboard/utils/to-object';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = FeaturedFavoritedMapsStore.mutations;
const actions = FeaturedFavoritedMapsStore.actions;

const getVisualizationMock = function getVisualization (_, params, callback) {
  let data = visualization;
  if (params.types === 'table') {
    data = datasets;
  }
  if (typeof params.order === 'boolean') {
    const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
    callback(err, null, null);
  } else {
    callback(null, null, data);
  }
};

describe('FeaturedFavoritedMapsStore', () => {
  describe('mutations', () => {
    it('setRequestError', () => {
      let state = {
        isFetching: false,
        isErrored: false,
        error: {}
      };

      let err = {
        status: 404
      };
      mutations.setRequestError(state, err);

      expect(state).toEqual({
        isFetching: false,
        isErrored: true,
        error: err
      });
    });

    it('setFeaturedFavoritedMaps', () => {
      let state = {
        list: {},
        metadata: {},
        isFetching: true
      };

      mutations.setFeaturedFavoritedMaps(state, visualization);

      expect(state).toEqual({
        list: toObject(visualization.visualizations, 'id'),
        metadata: {
          total_entries: visualization.total_entries,
          total_likes: visualization.total_likes,
          total_shared: visualization.total_shared,
          total_user_entries: visualization.total_user_entries
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
  });

  describe('actions', () => {
    describe('fetchMaps', () => {
      let state, rootState;

      beforeEach(() => {
        state = {
          isFetching: false,
          isFiltered: false,
          isErrored: false,
          error: {},
          list: {},
          metadata: {},
          order: 'updated_at',
          params: {
            per_page: 2,
            only_liked: true
          }
        };

        rootState = {
          client: {
            getVisualization: getVisualizationMock
          }
        };
      });

      it('success', done => {
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setFeaturedFavoritedMaps', payload: visualization }
        ];
        testAction({ action: actions.fetchMaps, state, rootState, expectedMutations, done });
      });

      it('errored', done => {
        state.order = false;
        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ];
        testAction({ action: actions.fetchMaps, state, rootState, expectedMutations, done });
      });
    });
  });
});
