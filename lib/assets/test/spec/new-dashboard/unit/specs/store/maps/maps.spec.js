import visualization from './fixtures/visualizations';
import MapsStore from 'new-dashboard/store/maps';
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

    it('setMaps', () => {
      let state = {
        list: {},
        metadata: {},
        isFetching: true
      };

      mutations.setMaps(state, visualization);

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

    it('setPagination', () => {
      let state = {
        page: 1,
        numPages: 1,
        metadata: {
          total_entries: 5
        },
        defaultParams: {
          per_page: 2
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 3,
        metadata: {
          total_entries: 5
        },
        defaultParams: {
          per_page: 2
        }
      });
    });

    it('updateMapLike', () => {
      let state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: false
          }
        }
      };

      mutations.updateMapLike(state, { mapId: 'xxxx-yyyy-zzzzz', liked: true });
      expect(state).toEqual({
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: true
          }
        }
      });
    });

    it('updateMapNumberLikes', () => {
      let state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            likes: 0
          }
        }
      };
      mutations.updateMapNumberLikes(state, { mapId: 'xxxx-yyyy-zzzzz', likes: 1 });
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
    describe('fetchMaps', () => {
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
          defaultParams: {
            exclude_shared: false,
            per_page: 1,
            shared: 'no',
            locked: false,
            only_liked: false,
            order: 'updated_at',
            types: 'derived',
            deepInsights: false
          }
        };
      });
      it('success', done => {
        testAction(actions.fetchMaps, null, state, [
          { type: 'setFetchingState' },
          { type: 'setMaps', payload: visualization },
          { type: 'setPagination', payload: state.page }
        ], [], done);
      });

      it('errored', done => {
        state.defaultParams.order = false;
        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };

        testAction(actions.fetchMaps, null, state, [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ], [], done);
      });
    });

    it('goToPage', done => {
      const page = 2;

      testAction(actions.goToPage, page, null,
        [{ type: 'setPagination', payload: page }],
        [{ type: 'fetchMaps' }],
        done);
    });

    it('filterLockedMaps', done => {
      const lockedParams = {
        'locked': true
      };

      testAction(actions.filterLockedMaps, null, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: 'locked' }
      ], [{ type: 'fetchMaps', payload: lockedParams }], done);
    });

    it('filterSharedMaps', done => {
      const sharedParams = {
        'shared': 'only'
      };

      testAction(actions.filterSharedMaps, null, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: 'shared' }
      ], [{ type: 'fetchMaps', payload: sharedParams }], done);
    });

    it('filterFavoritedMaps', done => {
      const favoritedParams = {
        'only_liked': true
      };

      testAction(actions.filterFavoritedMaps, null, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: 'favorited' }
      ], [{ type: 'fetchMaps', payload: favoritedParams }], done);
    });

    it('resetFilters', done => {
      testAction(actions.resetFilters, null, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: '' }
      ], [{ type: 'fetchMaps' }], done);
    });

    describe('likeMap', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(visualization.visualizations, 'id')
        };
      });
      it('success', done => {
        const mapId = '907307c8-c3e6-400d-9627-416f52f7d30d';
        testAction(actions.likeMap, state.list[mapId], state, [
          { type: 'updateMapLike', payload: { mapId: mapId, liked: true } },
          { type: 'updateMapNumberLikes', payload: { mapId: mapId, likes: 1 } }
        ], [], done);
      });

      it('errored', done => {
        const mapIdErr = 'f8e13983-bb08-4ca9-b64a-f34e76fe077a';
        const currentLikeStatus = state.list[mapIdErr].liked;
        testAction(actions.likeMap, state.list[mapIdErr], state, [
          { type: 'updateMapLike', payload: { mapId: mapIdErr, liked: true } },
          { type: 'updateMapLike', payload: { mapId: mapIdErr, liked: currentLikeStatus } }
        ], [], done);
      });
    });

    describe('deleteLikeMap', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(visualization.visualizations, 'id')
        };
      });
      it('success', done => {
        const mapId = '907307c8-c3e6-400d-9627-416f52f7d30d';
        testAction(actions.deleteLikeMap, state.list[mapId], state, [
          { type: 'updateMapLike', payload: { mapId: mapId, liked: false } },
          { type: 'updateMapNumberLikes', payload: { mapId: mapId, likes: 0 } }
        ], [], done);
      });
    });
  });
});
