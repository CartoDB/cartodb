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
        { type: 'setFilterType' }
      ], [{ type: 'fetchMaps' }], done);
    });

    it('setURLOptions', done => {
      const URLOptions = { filter: 'mine', page: 2 };

      testAction(actions.setURLOptions, URLOptions, null,
        [{ type: 'setURLOptions', payload: URLOptions }],
        [{ type: 'fetchMaps' }], done);
    });
  });
});
