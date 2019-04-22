import tag from '../../fixtures/tags';
import TagsStore from 'new-dashboard/store/modules/tags';
import { testAction } from '../helpers';

jest.mock('carto-node');

const mutations = TagsStore.mutations;
const actions = TagsStore.actions;

describe('TagsStore', () => {
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
          page: 1,
          numPages: 1
        };
      });

      it('success', done => {
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setTags', payload: tag }
        ];

        const getTags = (_1, callback) => callback(null, null, tag);
        const rootState = {
          client: { getTags }
        };

        testAction({ action: actions.fetch, state, expectedMutations, rootState, done });
      });

      it('errored', done => {
        state.order = false;
        const err = { error: 'Could not fetch tags.' };
        const expectedMutations = [
          { type: 'setFetchingState' },
          { type: 'setRequestError', payload: err }
        ];

        const getTags = (_1, callback) => callback(err, null, null);
        const rootState = {
          client: { getTags }
        };

        testAction({ action: actions.fetch, state, expectedMutations, rootState, done });
      });
    });
  });
});
