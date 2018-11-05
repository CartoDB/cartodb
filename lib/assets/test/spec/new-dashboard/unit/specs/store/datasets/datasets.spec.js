import datasets from '../../fixtures/visualizations';
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
        },
        defaultParams: {
          per_page: 2
        }
      };

      let page = 3;

      mutations.setPagination(state, page);

      expect(state).toEqual({
        page: 3,
        numPages: 5,
        metadata: {
          total_entries: 11
        },
        defaultParams: {
          per_page: 2
        }
      });
    });
  });
});
