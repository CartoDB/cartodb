import { testAction } from '../helpers';
import searchStore from 'new-dashboard/store/modules/search';
import visualizationsData from '../../fixtures/visualizations';
import datasetVisualizationsData from '../../fixtures/datasets';
import tagsData from '../../fixtures/tags';
import toObject from 'new-dashboard/utils/to-object';

describe('SearchStore', () => {
  describe('mutations', () => {
    describe('updatePage', () => {
      it('should update page number of the passed section', () => {
        const state = { maps: { page: 1 } };
        const pageOptions = { section: 'maps', page: 2 };

        searchStore.mutations.updatePage(state, pageOptions);

        expect(state).toEqual({ maps: { page: 2 } });
      });
    });

    describe('updateSearchTerm', () => {
      it('should set searchTerm if passed', () => {
        const state = { searchTerm: '' };

        searchStore.mutations.updateSearchTerm(state, { query: 'world borders' });

        expect(state).toEqual({ searchTerm: 'world borders' });
      });

      it('should set tag if passed', () => {
        const state = { tag: '' };

        searchStore.mutations.updateSearchTerm(state, { tag: 'borders' });

        expect(state).toEqual({ tag: 'borders' });
      });
    });

    describe('setFetchingState', () => {
      it("should set section's isFetching to true", () => {
        const state = { maps: { isFetching: false } };

        searchStore.mutations.setFetchingState(state, 'maps');

        expect(state).toEqual({ maps: { isFetching: true } });
      });
    });

    describe('setRequestError', () => {
      it("should set section's request error", () => {
        const state = { maps: { error: {} } };

        searchStore.mutations.setRequestError(state, {
          requestType: 'maps', error: { error: 'Wrong parameter' }
        });

        expect(state).toEqual({ maps: { error: { error: 'Wrong parameter' } } });
      });
    });

    describe('setMaps', () => {
      it('should set results, calculate pages and revert isFetching state', () => {
        const state = {
          resultsPerPage: 6,
          maps: {
            results: [],
            numResults: 0,
            numPages: 1
          }
        };

        const mapsData = {
          ...visualizationsData,
          total_entries: visualizationsData.visualizations.length
        };

        searchStore.mutations.setMaps(state, mapsData);

        expect(state).toEqual({
          resultsPerPage: 6,
          maps: {
            results: toObject(visualizationsData.visualizations, 'id'),
            numResults: visualizationsData.visualizations.length,
            numPages: 1,
            isFetching: false
          }
        });
      });
    });

    describe('setDatasets', () => {
      it('should set results, calculate pages and revert isFetching state', () => {
        const state = {
          resultsPerPage: 6,
          datasets: {
            results: [],
            numResults: 0,
            numPages: 1
          }
        };

        const datasetsData = {
          ...datasetVisualizationsData,
          total_entries: datasetVisualizationsData.visualizations.length
        };

        searchStore.mutations.setDatasets(state, datasetsData);

        expect(state).toEqual({
          resultsPerPage: 6,
          datasets: {
            results: toObject(datasetVisualizationsData.visualizations, 'id'),
            numResults: datasetVisualizationsData.visualizations.length,
            numPages: 1,
            isFetching: false
          }
        });
      });
    });

    describe('setTags', () => {
      it('should set results, calculate pages and revert isFetching state', () => {
        const state = {
          resultsPerPage: 6,
          tags: {
            results: [],
            numResults: 0,
            numPages: 1
          }
        };

        searchStore.mutations.setTags(state, tagsData);

        expect(state).toEqual({
          resultsPerPage: 6,
          tags: {
            results: tagsData.result,
            numResults: tagsData.total,
            numPages: 1,
            isFetching: false
          }
        });
      });
    });

    describe('resetState', () => {
      it('should set results, calculate pages and revert isFetching state', () => {
        const state = {
          searchTerm: 'searchTerm',
          tag: 'tag',
          maps: {
            isFetching: true,
            isErrored: true,
            results: toObject(visualizationsData.visualizations, 'id'),
            error: { error: 'Fake error' },
            page: 2,
            numPages: 3,
            numResults: visualizationsData.visualizations.length
          },
          datasets: {
            isFetching: true,
            isErrored: true,
            results: toObject(datasetVisualizationsData.visualizations, 'id'),
            error: { error: 'Fake error' },
            page: 2,
            numPages: 3,
            numResults: datasetVisualizationsData.visualizations.length
          },
          tags: {
            isFetching: true,
            isErrored: true,
            results: tagsData.result,
            error: { error: 'Fake error' },
            page: 2,
            numPages: 3,
            numResults: tagsData.total
          }
        };

        searchStore.mutations.resetState(state);

        expect(state).toEqual({
          searchTerm: '',
          tag: '',
          maps: {
            isFetching: false,
            isErrored: false,
            results: {},
            error: {},
            page: 1,
            numPages: 1,
            numResults: 0
          },
          datasets: {
            isFetching: false,
            isErrored: false,
            results: {},
            error: {},
            page: 1,
            numPages: 1,
            numResults: 0
          },
          tags: {
            isFetching: false,
            isErrored: false,
            results: [],
            error: {},
            page: 1,
            numPages: 1,
            numResults: 0
          }
        });
      });
    });
  });

  describe('getters', () => {
    describe('requestParameters', () => {
      it('should return request parameters', () => {
        const state = {
          searchTerm: 'Fake Search Term',
          tag: 'Fake Tag',
          resultsPerPage: 6
        };

        expect(searchStore.getters.requestParameters(state)).toEqual({
          exclude_shared: false,
          per_page: 6,
          q: 'Fake Search Term',
          shared: 'yes',
          tags: 'Fake Tag'
        });
      });
    });
  });

  describe('actions', () => {
    let rootState;

    beforeEach(() => {
      rootState = { client: {} };
    });

    describe('.doSearch', () => {
      it('should commit mutations to fetch maps, datasets and tags and set fetching state', done => {
        const actionPayload = { query: 'fakeSearchTerm' };

        testAction({
          action: searchStore.actions.doSearch,
          payload: actionPayload,
          expectedMutations: [
            { type: 'updateSearchTerm', payload: actionPayload },
            { type: 'setFetchingState', payload: 'maps' },
            { type: 'setFetchingState', payload: 'datasets' },
            { type: 'setFetchingState', payload: 'tags' }
          ],
          expectedActions: [
            { type: 'fetchMaps' },
            { type: 'fetchDatasets' },
            { type: 'fetchTags' }
          ],
          done
        });
      });

      it('should commit mutations to fetch maps, datasets and set fetching state when searching a tag', done => {
        const actionPayload = { tag: 'fakeSearchTag' };

        testAction({
          action: searchStore.actions.doSearch,
          payload: actionPayload,
          expectedMutations: [
            { type: 'updateSearchTerm', payload: actionPayload },
            { type: 'setFetchingState', payload: 'maps' },
            { type: 'setFetchingState', payload: 'datasets' }
          ],
          expectedActions: [
            { type: 'fetchMaps' },
            { type: 'fetchDatasets' }
          ],
          done
        });
      });
    });

    describe('.changeSectionPage', () => {
      it('should commit mutations to change page and fetch section data', done => {
        const actionPayload = { section: 'maps', page: 2 };

        testAction({
          action: searchStore.actions.changeSectionPage,
          payload: actionPayload,
          expectedMutations: [
            { type: 'setFetchingState', payload: 'maps' },
            { type: 'updatePage', payload: { section: 'maps', page: 2 } }
          ],
          expectedActions: [
            { type: 'fetchMaps' }
          ],
          done
        });
      });
    });

    describe('.fetchMaps', () => {
      it('should commit mutations to set data coming from API', done => {
        const apiData = {
          visualizations: []
        };

        const state = {
          maps: { page: 1 }
        };

        rootState.client.getVisualization = jest.fn((vizUrl, params, callback) => {
          callback(null, null, apiData);
        });

        const expectations = () => {
          expect(rootState.client.getVisualization).toHaveBeenCalledWith(
            '', { types: 'derived,kuviz', page: 1 }, expect.any(Function)
          );

          done();
        };

        testAction({
          action: searchStore.actions.fetchMaps,
          rootState,
          state,
          expectedMutations: [
            { type: 'setMaps', payload: apiData }
          ],
          done: expectations
        });
      });

      it('should commit mutations to set error coming from API if request fails', done => {
        const error = { error: 'Fake Error' };

        const state = {
          maps: { page: 1 }
        };

        rootState.client.getVisualization = jest.fn((vizUrl, params, callback) => {
          callback(error, null, null);
        });

        testAction({
          action: searchStore.actions.fetchMaps,
          rootState,
          state,
          expectedMutations: [
            { type: 'setRequestError', payload: { error, requestType: 'maps' } }
          ],
          done
        });
      });
    });

    describe('.fetchDatasets', () => {
      it('should commit mutations to set data coming from API', done => {
        const apiData = {
          visualizations: []
        };

        const state = {
          datasets: { page: 1 }
        };

        rootState.client.getVisualization = jest.fn((vizUrl, params, callback) => {
          callback(null, null, apiData);
        });

        const expectations = () => {
          expect(rootState.client.getVisualization).toHaveBeenCalledWith(
            '', { type: 'table', page: 1, with_dependent_visualizations: 10 }, expect.any(Function)
          );

          done();
        };

        testAction({
          action: searchStore.actions.fetchDatasets,
          rootState,
          state,
          expectedMutations: [
            { type: 'setDatasets', payload: apiData }
          ],
          done: expectations
        });
      });

      it('should commit mutations to set error coming from API if request fails', done => {
        const error = { error: 'Fake Error' };

        const state = {
          datasets: { page: 1 }
        };

        rootState.client.getVisualization = jest.fn((vizUrl, params, callback) => {
          callback(error, null, null);
        });

        testAction({
          action: searchStore.actions.fetchDatasets,
          rootState,
          state,
          expectedMutations: [
            { type: 'setRequestError', payload: { error, requestType: 'datasets' } }
          ],
          done
        });
      });
    });

    describe('.fetchTags', () => {
      it('should commit mutations to set data coming from API', done => {
        const apiData = {
          result: {}
        };

        const state = {
          tags: { page: 1 }
        };

        rootState.client.getTags = jest.fn((params, callback) => {
          callback(null, null, apiData);
        });

        const expectations = () => {
          expect(rootState.client.getTags).toHaveBeenCalledWith(
            { types: 'table,derived,kuviz', page: 1, include_shared: true }, expect.any(Function)
          );

          done();
        };

        testAction({
          action: searchStore.actions.fetchTags,
          rootState,
          state,
          expectedMutations: [
            { type: 'setTags', payload: apiData }
          ],
          done: expectations
        });
      });

      it('should commit mutations to set error coming from API if request fails', done => {
        const error = { error: 'Fake Error' };

        const state = {
          tags: { page: 1 }
        };

        rootState.client.getTags = jest.fn((params, callback) => {
          callback(error, null, null);
        });

        testAction({
          action: searchStore.actions.fetchTags,
          rootState,
          state,
          expectedMutations: [
            { type: 'setRequestError', payload: { error, requestType: 'tags' } }
          ],
          done
        });
      });
    });

    describe('.resetState', () => {
      it('should commit mutation to resetState', done => {
        testAction({
          action: searchStore.actions.resetState,
          expectedMutations: [
            { type: 'resetState' }
          ],
          done
        });
      });
    });
  });
});
