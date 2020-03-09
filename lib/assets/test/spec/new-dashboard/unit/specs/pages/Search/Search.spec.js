import { shallowMount } from '@vue/test-utils';
import Search from 'new-dashboard/pages/Search';
import { store, fetchingStore, resultsStore } from './state';

describe('Search.vue', () => {
  describe('Rendering', () => {
    it('should render fetching state correctly', () => {
      const searchComponent = createSearchComponent({
        mocks: {
          $store: fetchingStore
        }
      });
      expect(searchComponent).toMatchSnapshot();
    });

    it('should render empty state correctly', () => {
      const searchComponent = createSearchComponent({
        data () {
          return {
            isFirstFetch: false
          };
        }
      });

      expect(searchComponent).toMatchSnapshot();
    });

    it('should render search results correctly', () => {
      const searchComponent = createSearchComponent({
        data () {
          return {
            isFirstFetch: false
          };
        },
        mocks: {
          $store: resultsStore
        }
      });

      expect(searchComponent).toMatchSnapshot();
    });
  });

  describe('Methods', () => {
    describe('onPageChange', () => {
      it('should dispatch changeSectionPage action and call scrollToSection', () => {
        const storeDispatchFn = jest.fn();
        const searchComponent = createSearchComponent({
          mocks: {
            $store: {
              dispatch: storeDispatchFn,
              ...store
            }
          }
        });

        spyOn(searchComponent.vm, 'scrollToSection');

        const section = 'maps';
        const page = 2;

        searchComponent.vm.onPageChange(section, page);

        expect(storeDispatchFn).toHaveBeenCalledWith('search/changeSectionPage', { section, page });
        expect(searchComponent.vm.scrollToSection).toHaveBeenCalledWith(section);
      });
    });

    describe('isOutOfViewport', () => {
      it("should return true if element's top position is less than headers offset", () => {
        const elementBoundingClientRect = {
          top: 119
        };

        const searchComponent = createSearchComponent();
        expect(searchComponent.vm.isOutOfViewport(elementBoundingClientRect)).toBe(true);
      });
    });

    describe('isOutOfViewport', () => {
      it("should return true if element's top position is less than headers offset", () => {
        // Note: Default boundingClientRect's top is 0, which is handy for us
        // given that our two headers size is 128
        const elementBoundingClientRect = {
          top: 127
        };

        const searchComponent = createSearchComponent();
        expect(searchComponent.vm.isOutOfViewport(elementBoundingClientRect)).toBe(true);
      });
    });

    describe('scrollToSection', () => {
      it('should call scrollBy if element is out of viewport', () => {
        // Note: Default boundingClientRect's top is 0, which is handy for us
        // given that our two headers size is 128
        const scrollBySpy = spyOn(window, 'scrollBy');
        const searchComponent = createSearchComponent();

        searchComponent.vm.scrollToSection('maps');

        expect(scrollBySpy).toHaveBeenCalledWith({ behavior: 'smooth', top: -144 });
      });

      it('should call scrollBy if element is inside the viewport', () => {
        const scrollBySpy = spyOn(window, 'scrollBy');
        const searchComponent = createSearchComponent();
        spyOn(searchComponent.vm, 'isOutOfViewport').and.returnValue(false);

        searchComponent.vm.scrollToSection('maps');

        expect(scrollBySpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Watch', () => {
    describe('allSectionsFetching', () => {
      it('should set isFirstFetch to false when allSectionsFetching changes to false', done => {
        const mockStore = { ...store };
        const searchComponent = createSearchComponent({
          data () {
            return {
              allSectionsFetching: true
            };
          },
          mocks: { $store: mockStore }
        });

        searchComponent.vm.allSectionsFetching = false;

        searchComponent.vm.$nextTick(() => {
          expect(searchComponent.vm.isFirstFetch).toBe(false);
          done();
        });
      });
    });
  });

  describe('Router Hooks', () => {
    describe('beforeRouteUpdate', () => {
      it('should dispatch resetState, and set isFirstFetch to true', () => {
        const storeDispatchFn = jest.fn();
        const $store = {
          dispatch: storeDispatchFn
        };

        const to = {
          params: {
            query: 'Query text'
          }
        };

        const updateSearchParams = () => {};

        Search.beforeRouteUpdate.apply({ $store, updateSearchParams }, [to, null, () => {}]);

        expect(storeDispatchFn).toHaveBeenCalledWith('search/resetState');
      });
    });
  });
});

function createSearchComponent (options = { mocks: {} }) {
  return shallowMount(Search, {
    computed: {
      searchTerm () {
        return 'Query text';
      },
      isNotificationVisible () {
        return false;
      }
    },
    ...options,
    mocks: {
      $t: key => key,
      $tc: key => key,
      $store: store,
      ...options.mocks
    }
  });
}
