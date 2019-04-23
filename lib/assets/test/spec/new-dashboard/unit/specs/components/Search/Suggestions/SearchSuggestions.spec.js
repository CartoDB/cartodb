import { mount } from '@vue/test-utils';
import SearchSuggestions from 'new-dashboard/components/Search/Suggestions/SearchSuggestions';
import searchPreviewData from '../../../fixtures/searchPreview';

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
    describe('searchRoute', () => {
      it('should return search', () => {
        const searchSuggestions = createSearchSuggestions();
        expect(searchSuggestions.vm.searchRoute).toBe('search');
      });
    });

    describe('searchRouteParameters', () => {
      it('should return object with query property', () => {
        const searchSuggestions = createSearchSuggestions({});
        expect(searchSuggestions.vm.searchRouteParameters).toEqual({
          query: 'Query text'
        });
      });
    });
  });

  describe('Methods', () => {
    describe('fetchSuggestions', () => {
      it('should not request suggestions if query is empty', () => {
        const previewSearchSpy = jest.fn();

        const searchSuggestions = createSearchSuggestions({
          propsData: {
            query: ''
          },
          data () {
            return {
              isFetching: true,
              searchResults: {},
              client: { previewSearch: previewSearchSpy }
            };
          }
        });

        searchSuggestions.vm.fetchSuggestions();

        expect(searchSuggestions.vm.searchResults).toEqual({});
        expect(previewSearchSpy).not.toHaveBeenCalled();
      });

      it('should set search results via API', () => {
        const previewSearchSpy = jest.fn((query, callback) => {
          callback(null, null, searchPreviewData);
        });

        const searchSuggestions = createSearchSuggestions({
          propsData: {
            query: 'map'
          },
          data () {
            return {
              isFetching: true,
              searchResults: {},
              client: { previewSearch: previewSearchSpy }
            };
          }
        });

        searchSuggestions.vm.fetchSuggestions();

        expect(searchSuggestions.vm.searchResults).toEqual(searchPreviewData);
        expect(previewSearchSpy).toHaveBeenCalledWith('map', expect.any(Function));
      });

      it('should not set search results via API if request is errored', () => {
        const error = { error: 'API Error' };
        const previewSearchSpy = jest.fn((query, callback) => {
          callback(error, null, null);
        });

        const searchSuggestions = createSearchSuggestions({
          data () {
            return {
              isFetching: true,
              searchResults: {},
              client: { previewSearch: previewSearchSpy }
            };
          }
        });

        searchSuggestions.vm.fetchSuggestions();

        expect(searchSuggestions.vm.searchResults).toEqual({});
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
              searchResults: searchPreviewData
            };
          }
        });
        searchSuggestions.vm.keydownDown();
        searchSuggestions.vm.keydownDown();
        searchSuggestions.vm.keydownDown();
        const activeSuggestion = searchSuggestions.vm.getActiveSuggestionElement();
        expect(activeSuggestion.getAttribute('href')).toEqual(searchPreviewData.result[1].url);
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
          expect(searchSuggestions.vm.searchResults).toEqual({});
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
        searchResults: searchPreviewData,
        activeSuggestionIndex: -1
      };
    },
    ...options
  });
}
