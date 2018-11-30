import { shallowMount } from '@vue/test-utils';
import Search from 'new-dashboard/components/Search/Search';
// import visualizationData from '../../../fixtures/visualizations';

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

      it('should redirect to tag search when form is submitted with : in query', () => {
        const routerPushSpy = jest.fn();
        const searchComponent = createSearchComponent({
          data () {
            return { searchTerm: ':tagname' };
          },
          mocks: {
            $router: { push: routerPushSpy }
          }
        });

        searchComponent.find('form').trigger('submit');

        expect(routerPushSpy).toHaveBeenCalledWith({
          name: 'tagSearch',
          params: {
            tag: 'tagname'
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
  });
});

function createSearchComponent (options = { mocks: {} }) {
  return shallowMount(Search, {
    propsData: { isSearchOpen: true },
    ...options,
    mocks: {
      $t: key => key,
      ...options.mocks
    }
  });
}
