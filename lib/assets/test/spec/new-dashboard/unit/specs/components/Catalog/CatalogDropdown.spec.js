import { shallowMount } from '@vue/test-utils';
import CatalogDropdown from 'new-dashboard/components/Catalog/CatalogDropdown';
import PerfectScrollbar from 'perfect-scrollbar';

const $t = key => key;

describe('CatalogDropdown.vue', () => {
  function createCatalogDropdown (overridenComponentOptions) {
    return shallowMount(CatalogDropdown, {
      mocks: {
        $t
      },
      propsData: {
        title: 'Title',
        placeholder: 'Placeholder',
        options: [],
        open: true,
        disabled: false,
        limitHeight: false
      },
      slots: {
        extra: 'Extra Content'
      },
      ...overridenComponentOptions
    });
  }

  beforeAll(() => {
    spyOn(PerfectScrollbar, 'initialize').and.returnValue('initialized');
    spyOn(PerfectScrollbar, 'update').and.returnValue('updated');
    spyOn(PerfectScrollbar, 'destroy').and.returnValue('destroyed');
  });

  it('should render correct contents', () => {
    const catalogDropdown = createCatalogDropdown();
    expect(catalogDropdown).toMatchSnapshot();
  });

  it('should be opened by default if open is true', () => {
    const catalogDropdown = createCatalogDropdown({
      propsData: {
        open: true
      }
    });

    expect(catalogDropdown).toMatchSnapshot();
  });

  it('should be closed by default if open is false', () => {
    const catalogDropdown = createCatalogDropdown({
      propsData: {
        open: false
      }
    });

    expect(catalogDropdown).toMatchSnapshot();
  });

  it('should be disabled by default if disabled is true', () => {
    const catalogDropdown = createCatalogDropdown({
      propsData: {
        disabled: true
      }
    });

    expect(catalogDropdown).toMatchSnapshot();
  });

  it('should be enabled by default if disabled is false', () => {
    const catalogDropdown = createCatalogDropdown({
      propsData: {
        disabled: false
      }
    });

    expect(catalogDropdown).toMatchSnapshot();
  });
  
  describe('Items', () => {
    it('should show up to 8 items if the screen height by default', () => {
      const options = ['o_1', 'o_2', 'o_3', 'o_4', 'o_5', 'o_6', 'o_7', 'o_8', 'o_9'];
      
      window.innerHeight = 1200;

      const catalogDropdown = createCatalogDropdown({
        propsData: {
          options,
          open: true,
          disabled: false,
          limitHeight: false
        }
      });

      expect(catalogDropdown.vm.maxItemsScroll).toEqual(8);
    });

    it('should show up to 3 items if the screen height is "small"', () => {
      const options = ['o_1', 'o_2', 'o_3', 'o_4', 'o_5', 'o_6', 'o_7', 'o_8', 'o_9'];
      
      window.innerHeight = 300;

      const catalogDropdown = createCatalogDropdown({
        propsData: {
          options,
          open: true,
          disabled: false,
          limitHeight: false
        }
      });

      expect(catalogDropdown.vm.maxItemsScroll).toEqual(3);
    });

    it('should show up to 5 items if the screen height is "medium"', () => {
      const options = ['o_1', 'o_2', 'o_3', 'o_4', 'o_5', 'o_6', 'o_7', 'o_8', 'o_9'];
      
      window.innerHeight = 700;

      const catalogDropdown = createCatalogDropdown({
        propsData: {
          options,
          open: true,
          disabled: false,
          limitHeight: false
        }
      });

      expect(catalogDropdown.vm.maxItemsScroll).toEqual(5);
    });
  });

  describe('Search', () => {
    it('should be visible when there is an items overflow', () => {
      const options = ['o_1', 'o_2', 'o_3', 'o_4', 'o_5', 'o_6', 'o_7', 'o_8', 'o_9', 'o_10'];

      const catalogDropdown = createCatalogDropdown({
        propsData: {
          options,
          open: true,
          disabled: false,
          limitHeight: false
        }
      });

      expect(catalogDropdown).toMatchSnapshot();
    });

    it('should be hidden if there is no items overflow', () => {
      const options = ['o_1', 'o_2', 'o_3'];

      const catalogDropdown = createCatalogDropdown({
        propsData: {
          options,
          open: true,
          disabled: false,
          limitHeight: false
        }
      });

      expect(catalogDropdown).toMatchSnapshot();
    });
  });
});
