import { mount } from '@vue/test-utils';
import Search from 'new-dashboard/components/Search/Search';

describe('Search.vue', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      const searchComponent = createSearchComponent();
      expect(searchComponent).toMatchSnapshot();
    });

    it('should render when search is open and filled correctly', () => {
      const searchComponent = createSearchComponent({
        propsData: { isSearchOpen: true },
        data () {
          return {
            searchTerm: 'Query text',
            isInputFocused: true
          };
        }
      });
      expect(searchComponent).toMatchSnapshot();
    });
  });

  describe('Methods', () => {
    describe('onInputFocus', () => {
      it('should set isInputFocused to true when input focuses', () => {
        const searchComponent = createSearchComponent();
        searchComponent.find('input').trigger('focus');
        expect(searchComponent.vm.isInputFocused).toBe(true);
      });
    });

    describe('onInputBlur', () => {
      it('should set isInputFocused to true when input focuses', () => {
        const searchComponent = createSearchComponent({
          data () {
            return { isInputFocused: true };
          }
        });
        searchComponent.find('input').trigger('blur');
        expect(searchComponent.vm.isInputFocused).toBe(false);
      });
    });

    describe('onFormSubmit', () => {
      it('should reset props and redirect to regular search when form is submitted', () => {
        const routerPushSpy = jest.fn();
        const searchComponent = createSearchComponent({
          data () {
            return { searchTerm: 'Query text' };
          },
          mocks: {
            $router: { push: routerPushSpy }
          }
        });

        spyOn(searchComponent.vm, 'blurInput');

        searchComponent.find('form').trigger('submit');

        expect(searchComponent.vm.blurInput).toHaveBeenCalled();
        expect(searchComponent.vm.searchTerm).toEqual('');
        expect(routerPushSpy).toHaveBeenCalledWith({
          name: 'search',
          params: {
            query: 'Query text'
          }
        });
      });
    });

    describe('blurInput', () => {
      it('should blur input when called', () => {
        const searchComponent = createSearchComponent({
          data () {
            return { isInputFocused: true };
          }
        });

        spyOn(searchComponent.vm.$refs.searchInput, 'blur');
        searchComponent.vm.$forceUpdate();

        searchComponent.vm.blurInput();

        expect(searchComponent.vm.$refs.searchInput.blur).toHaveBeenCalled();
      });
    });

    describe('resetInput', () => {
      it('should wipe searchTerm and blur input when called', () => {
        const searchComponent = createSearchComponent({
          data () {
            return { searchTerm: 'Query text' };
          }
        });

        spyOn(searchComponent.vm, 'blurInput');

        searchComponent.vm.resetInput();

        expect(searchComponent.vm.searchTerm).toEqual('');
        expect(searchComponent.vm.blurInput).toHaveBeenCalled();
      });
    });

    describe('onKeydownDown', () => {
      it('should call keydownDown of search suggestions', () => {
        const searchComponent = createSearchComponent({
          data () {
            return {
              searchTerm: 'Query text',
              isInputFocused: true
            };
          }
        });

        spyOn(searchComponent.vm.$refs.searchSuggestions, 'keydownDown');

        searchComponent.trigger('keydown.down');

        expect(searchComponent.vm.$refs.searchSuggestions.keydownDown).toHaveBeenCalled();
      });
    });

    describe('onKeydownUp', () => {
      it('should call keydownUp of search suggestions', () => {
        const searchComponent = createSearchComponent({
          data () {
            return {
              searchTerm: 'Query text',
              isInputFocused: true
            };
          }
        });

        spyOn(searchComponent.vm.$refs.searchSuggestions, 'keydownUp');

        searchComponent.trigger('keydown.up');

        expect(searchComponent.vm.$refs.searchSuggestions.keydownUp).toHaveBeenCalled();
      });
    });

    describe('onKeydownEnter', () => {
      it('should open the search page for the query text', () => {
        const routerPushSpy = jest.fn();
        const searchComponent = createSearchComponent({
          data () {
            return {
              searchTerm: 'Query text',
              isInputFocused: true
            };
          },
          mocks: {
            $router: { push: routerPushSpy }
          }
        });

        spyOn(searchComponent.vm.$refs.searchSuggestions, 'getActiveSuggestionElement');

        searchComponent.trigger('keydown.enter');

        expect(searchComponent.vm.$refs.searchSuggestions.getActiveSuggestionElement).toHaveBeenCalled();
        expect(routerPushSpy).toHaveBeenCalledWith({
          name: 'search',
          params: {
            query: 'Query text'
          }
        });
      });

      it('should trigger click for the active element in the suggestions list', () => {
        const activeSuggestion = {
          click: jest.fn()
        };
        const searchComponent = createSearchComponent({
          data () {
            return {
              searchTerm: 'map',
              isInputFocused: true
            };
          }
        });
        spyOn(searchComponent.vm.$refs.searchSuggestions, 'getActiveSuggestionElement').and.returnValue(activeSuggestion);
        searchComponent.trigger('keydown.enter');

        expect(activeSuggestion.click).toHaveBeenCalled();
      });
    });
  });
});

function createSearchComponent (options = { mocks: {} }) {
  return mount(Search, {
    propsData: { isSearchOpen: true },
    ...options,
    mocks: {
      $t: key => key,
      ...options.mocks
    }
  });
}
