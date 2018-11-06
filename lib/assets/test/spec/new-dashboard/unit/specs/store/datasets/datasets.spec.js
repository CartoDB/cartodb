import datasets from '../../fixtures/datasets';
import { defaultParams as filtersDefaultParams } from 'new-dashboard/store/datasets/filters';
import DatasetsStore from 'new-dashboard/store/datasets';
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

    it('setDatasets', () => {
      let state = {
        list: {},
        metadata: {},
        isFetching: true
      };

      mutations.setDatasets(state, datasets);

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

    it('setURLOptions', () => {
      let state = {
        page: 1,
        filterType: 'mine'
      };

      mutations.setURLOptions(state, { filter: 'liked', page: 2 });

      expect(state).toEqual({
        page: 2,
        filterType: 'liked'
      });
    });

    it('setPagination', () => {
      let state = {
        page: 1,
        numPages: 1,
        metadata: {
          total_entries: 11
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 6,
        metadata: {
          total_entries: 11
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
        testAction(actions.fetchDatasets, null, state, [
          { type: 'setFetchingState' },
          { type: 'setDatasets', payload: datasets },
          { type: 'setPagination', payload: state.page }
        ], [], done);
      });

      it('errored', done => {
        state.order = false;
        const err = { error: "Wrong 'order' parameter value. Valid values are one of [:updated_at, :size, :mapviews, :likes]" };

        testAction(actions.fetchDatasets, null, state, [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ], [], done);
      });
    });

    it('setURLOptions', done => {
      const URLOptions = { filter: 'favorited', page: 2 };
      testAction(actions.setURLOptions, URLOptions, null,
        [{ type: 'setURLOptions', payload: URLOptions }],
        [{ type: 'fetchDatasets' }], done);
    });
  });
});
