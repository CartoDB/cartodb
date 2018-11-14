import visualization from '../../fixtures/visualizations';
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
          total_entries: 24
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 2,
        metadata: {
          total_entries: 24
        }
      });
    });

    it('setMapAttributes', () => {
      let state = {
        list: {
          'fake-map-id': {
            id: 'fake-map-id',
            name: '',
            description: ''
          }
        }
      };

      mutations.setMapAttributes(state, {
        mapId: 'fake-map-id',
        mapAttributes: {
          name: 'Fake Map Name',
          description: 'Fake Map Description'
        }
      });

      expect(state).toEqual({
        list: {
          'fake-map-id': {
            id: 'fake-map-id',
            name: 'Fake Map Name',
            description: 'Fake Map Description'
          }
        }
      });
    });

    it('setURLOptions', () => {
      let state = {
        page: 1,
        filterType: 'mine'
      };

      mutations.setURLOptions(state, { filter: 'locked', page: 3 });

      expect(state).toEqual({
        page: 3,
        filterType: 'locked'
      });
    });

    it('updateLike', () => {
      let state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: false
          }
        }
      };

      mutations.updateLike(state, { mapId: 'xxxx-yyyy-zzzzz', liked: true });
      expect(state).toEqual({
        list: {
          'xxxx-yyyy-zzzzz': {
            liked: true
          }
        }
      });
    });

    it('updateNumberLikes', () => {
      let state = {
        list: {
          'xxxx-yyyy-zzzzz': {
            likes: 0
          }
        }
      };
      mutations.updateNumberLikes(state, { mapId: 'xxxx-yyyy-zzzzz', likes: 1 });
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
          order: 'updated_at'
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
        state.order = false;
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

    it('filterMaps', done => {
      const filter = 'shared';

      testAction(actions.filterMaps, { filter }, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: { filter } }
      ], [{ type: 'fetchMaps' }], done);
    });

    it('orderMaps', done => {
      const order = '-updated_at';

      testAction(actions.orderMaps, { order }, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setOrder', payload: { order } }
      ], [{ type: 'fetchMaps' }], done);
    });

    it('resetFilters', done => {
      testAction(actions.resetFilters, null, null, [
        { type: 'setPagination', payload: 1 },
        { type: 'setFilterType', payload: '' }
      ], [{ type: 'fetchMaps' }], done);
    });

    it('updateMap', done => {
      const mapOptions = {
        mapId: 'fake-map-id',
        mapAttributes: {
          name: 'Fake Map Name',
          description: 'Fake Map Description'
        }
      };

      testAction(actions.updateMap, mapOptions, null, [
        { type: 'setMapAttributes', payload: mapOptions }
      ], [], done);
    });

    it('setURLOptions', done => {
      const URLOptions = { filter: 'mine', page: 2 };

      testAction(actions.setURLOptions, URLOptions, null,
        [{ type: 'setURLOptions', payload: URLOptions }],
        [{ type: 'fetchMaps' }], done);
    });

    describe('like', () => {
      let state;
      beforeEach(() => {
        state = {
          list: toObject(visualization.visualizations, 'id')
        };
      });
      it('success', done => {
        const mapId = 'e97e0001-f1c2-425e-8c9b-0fb28da59200';
        testAction(actions.like, state.list[mapId], state, [
          { type: 'updateLike', payload: { mapId: mapId, liked: true } },
          { type: 'updateNumberLikes', payload: { mapId: mapId, likes: state.list[mapId].likes + 1 } }
        ], [], done);
      });

      it('errored', done => {
        const mapIdErr = '8b378bf8-e74d-4187-9e57-4249db4c0f1f';
        const currentLikeStatus = state.list[mapIdErr].liked;
        testAction(actions.like, state.list[mapIdErr], state, [
          { type: 'updateLike', payload: { mapId: mapIdErr, liked: true } },
          { type: 'updateLike', payload: { mapId: mapIdErr, liked: currentLikeStatus } }
        ], [], done);
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
        const mapId = '8b378bf8-e74d-4187-9e57-4249db4c0f1f';
        testAction(actions.deleteLike, state.list[mapId], state, [
          { type: 'updateLike', payload: { mapId: mapId, liked: false } },
          { type: 'updateNumberLikes', payload: { mapId: mapId, likes: state.list[mapId].likes - 1 } }
        ], [], done);
      });
    });
  });
});
