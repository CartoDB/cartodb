import { mount } from '@vue/test-utils';
import SearchSuggestions from 'new-dashboard/components/Search/Suggestions/SearchSuggestions';
import visualizationData from '../../../fixtures/visualizations';

describe('SearchSuggestions.vue', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      const searchSuggestions = createSearchSuggestions();
      expect(searchSuggestions).toMatchSnapshot();
    });

    it('should render isFetching state', () => {
      const searchSuggestions = createSearchSuggestions({
        data () {
          return { isFetching: true };
        }
      });

      expect(searchSuggestions).toMatchSnapshot();
    });
  });

  it('should define fetchSuggestionsDebounced', () => {
    const searchSuggestions = createSearchSuggestions();
    expect(searchSuggestions.vm.fetchSuggestionsDebounced).toBeDefined();
  });

  describe('Computed Properties', () => {
    describe('isSearchingTags', () => {
      it('should return true if query includes :', () => {
        const searchSuggestions = createSearchSuggestions({
          propsData: { query: ':tagname' }
        });
        expect(searchSuggestions.vm.isSearchingTags).toBe(true);
      });

      it("should return false if query doesn't include :", () => {
        const searchSuggestions = createSearchSuggestions({
          propsData: { query: 'query text' }
        });
        expect(searchSuggestions.vm.isSearchingTags).toBe(false);
      });
    });

    describe('searchRoute', () => {
      it('should return tagSearch if isSearchingTags is true', () => {
        const searchSuggestions = createSearchSuggestions({
          computed: {
            isSearchingTags () { return true; }
          }
        });
        expect(searchSuggestions.vm.searchRoute).toBe('tagSearch');
      });

      it('should return search if isSearchingTags is false', () => {
        const searchSuggestions = createSearchSuggestions();
        expect(searchSuggestions.vm.searchRoute).toBe('search');
      });
    });

    describe('searchRouteParameters', () => {
      it('should return object with tag property if isSearchingTags is true', () => {
        const searchSuggestions = createSearchSuggestions({
          propsData: { query: ':tagname' },
          computed: {
            isSearchingTags () { return true; }
          }
        });
        expect(searchSuggestions.vm.searchRouteParameters).toEqual({
          tag: 'tagname'
        });
      });

      it('should return object with query property if isSearchingTags is false', () => {
        const searchSuggestions = createSearchSuggestions({
          computed: {
            isSearchingTags () { return false; }
          }
        });
        expect(searchSuggestions.vm.searchRouteParameters).toEqual({
          query: 'Query text'
        });
      });
    });

    describe('queryParameters', () => {
      it('should return proper query parameters if isSearchingTags is true', () => {
        const searchSuggestions = createSearchSuggestions({
          propsData: { query: ':tagname' },
          computed: {
            isSearchingTags () { return true; }
          }
        });
        expect(searchSuggestions.vm.queryParameters).toEqual({
          types: 'derived,table',
          per_page: 4,
          tags: 'tagname'
        });
      });

      it('should return proper query parameters if isSearchingTags is false', () => {
        const searchSuggestions = createSearchSuggestions({
          computed: {
            isSearchingTags () { return false; }
          }
        });
        expect(searchSuggestions.vm.queryParameters).toEqual({
          types: 'derived,table',
          per_page: 4,
          q: 'Query text'
        });
      });
    });
  });

  describe('Methods', () => {
    describe('fetchSuggestions', () => {
      it('should not request suggestions if query is empty', () => {

      });

      it('should set search results via API', () => {
        const getVisualizationSpy = jest.fn();

        const searchSuggestions = createSearchSuggestions({
          propsData: {
            query: ''
          },
          data () {
            return {
              isFetching: true,
              searchResults: [],
              client: { getVisualization: getVisualizationSpy }
            };
          }
        });

        searchSuggestions.vm.fetchSuggestions();

        expect(searchSuggestions.vm.searchResults).toEqual([]);
        expect(getVisualizationSpy).not.toHaveBeenCalled();
      });

      it('should not set search results via API if request is errored', () => {
        const error = { error: 'API Error' };
        const getVisualizationSpy = jest.fn((vizUrl, params, callback) => {
          callback(error, null, null);
        });

        const searchSuggestions = createSearchSuggestions({
          data () {
            return {
              isFetching: true,
              searchResults: [],
              client: { getVisualization: getVisualizationSpy }
            };
          }
        });

        searchSuggestions.vm.fetchSuggestions();

        expect(searchSuggestions.vm.searchResults).toEqual([]);
      });
    });

    describe('onPageChange', () => {
      const searchSuggestions = createSearchSuggestions();
      searchSuggestions.vm.onPageChange();
      expect(searchSuggestions.emitted('pageChange')).toBeTruthy();
    });

    describe('getActiveSuggestionElement', () => {
      it('should return the proper suggestion list element', () => {
        const searchSuggestions = createSearchSuggestions({
          data () {
            return {
              searchResults: visualizationData
            };
          }
        });
        searchSuggestions.vm.keydownDown();
        searchSuggestions.vm.keydownDown();
        const activeSuggestion = searchSuggestions.vm.getActiveSuggestionElement();
        expect(activeSuggestion.getAttribute('href')).toEqual(visualizationData.visualizations[0].url);
      });
    });

    describe('keydownDown', () => {
      it('should set as active the next item in the suggestion list', () => {
        const searchSuggestions = createSearchSuggestions();
        searchSuggestions.vm.keydownDown();
        expect(searchSuggestions.vm.activeSuggestionIndex).toEqual(0);
      });
    });

    describe('keydownUp', () => {
      it('should set as active the previous item in the suggestion list', () => {
        const searchSuggestions = createSearchSuggestions({
          data () {
            return {
              activeSuggestionIndex: 3
            };
          }
        });
        searchSuggestions.vm.keydownUp();
        expect(searchSuggestions.vm.activeSuggestionIndex).toEqual(2);
      });
    });

    describe('resetActiveSuggestion', () => {
      it('should reset the active item to the initial state', () => {
        const searchSuggestions = createSearchSuggestions({
          data () {
            return {
              activeSuggestionIndex: 3
            };
          }
        });

        searchSuggestions.trigger('mouseleave');
        expect(searchSuggestions.vm.activeSuggestionIndex).toEqual(-1);
      });
    });

    describe('updateActiveSuggestion', () => {
      it('should update the active element to the third search suggestion', () => {
        const searchSuggestions = createSearchSuggestions();

        searchSuggestions.find('.suggestions__content li').trigger('mouseover');
        expect(searchSuggestions.vm.activeSuggestionIndex).toEqual(0);
      });
    });
  });

  describe('Watch', () => {
    describe('query', () => {
      it('should fetch suggestions when query changes', done => {
        const searchSuggestions = createSearchSuggestions();
        spyOn(searchSuggestions.vm, 'fetchSuggestionsDebounced');

        searchSuggestions.vm.query = 'New query';

        searchSuggestions.vm.$nextTick(() => {
          expect(searchSuggestions.vm.isFetching).toBe(true);
          expect(searchSuggestions.vm.fetchSuggestionsDebounced).toHaveBeenCalled();
          done();
        });
      });

      it('should reset fetching state and results when query changes and is empty', done => {
        const searchSuggestions = createSearchSuggestions();
        spyOn(searchSuggestions.vm, 'fetchSuggestionsDebounced');

        searchSuggestions.vm.query = '';

        searchSuggestions.vm.$nextTick(() => {
          expect(searchSuggestions.vm.isFetching).toBe(false);
          expect(searchSuggestions.vm.searchResults).toEqual([]);
          expect(searchSuggestions.vm.fetchSuggestionsDebounced).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });
});

function createSearchSuggestions (options) {
  return mount(SearchSuggestions, {
    propsData: {
      query: 'Query text',
      isOpen: true
    },
    data () {
      return {
        isFetching: false,
        searchResults: visualizationData,
        activeSuggestionIndex: -1
      };
    },
    ...options
  });
}
