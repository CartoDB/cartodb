import { shallowMount } from '@vue/test-utils';
import FilterDropdown from 'new-dashboard/components/FilterDropdown';
import { filterIcon } from 'icons';

const $t = key => key;

describe('FilterDropdown.vue', () => {
  it('should render correct contents based on filter and order', () => {
    const filterDropdown = createFilterDropdown({
      filter: 'link',
      order: 'updated_at',
      section: 'maps',
      metadata: {
        total_likes: 10,
        total_shared: 10
      }
    });
    expect(filterDropdown).toMatchSnapshot();
  });

  it('should open dropdown when clicking toggle', () => {
    const filterDropdown = createFilterDropdown();

    filterDropdown.find('.dropdown__toggle').trigger('click');

    expect(filterDropdown).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('setFilter', () => {
      const filterDropdown = createFilterDropdown();
      const filterElement = filterDropdown.findAll('.element').at(1);

      filterElement.trigger('click');

      expect(filterDropdown.emitted('filterChanged')).toBeTruthy();
      expect(filterDropdown.emitted().filterChanged[0]).toEqual(['shared']);
    });

    describe('setOrder', () => {
      const filterDropdown = createFilterDropdown();
      const filterElement = filterDropdown.find('.section:nth-child(2) .element');

      filterElement.trigger('click');

      expect(filterDropdown.emitted('orderChanged')).toBeTruthy();
      expect(filterDropdown.emitted().orderChanged[0]).toEqual(['favouritesFirst']);
    });
  });
});

function createFilterDropdown (
  propsData = {
    section: 'maps',
    filter: 'mine',
    order: 'updated_at',
    metadata: { total_likes: 10, total_shared: 10 }
  }) {
  return shallowMount(FilterDropdown, {
    mocks: { $t },
    propsData,
    slots: {
      default: filterIcon
    }
  });
}
