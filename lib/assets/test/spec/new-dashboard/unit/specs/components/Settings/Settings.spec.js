import { mount } from '@vue/test-utils';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import { filterIcon } from 'icons';

const $t = key => key;

describe('Settings.vue', () => {
  it('should render correct contents based on filter and order', () => {
    const settingsDropdown = createSettingsDropdown({
      filter: 'link',
      order: 'updated_at',
      orderDirection: 'desc',
      section: 'maps',
      metadata: {
        total_likes: 10,
        total_shared: 10,
        total_locked: 10
      }
    });
    expect(settingsDropdown).toMatchSnapshot();
  });

  it('should open dropdown when clicking toggle', () => {
    const settingsDropdown = createSettingsDropdown();

    settingsDropdown.find('.dropdown__toggle').trigger('click');

    expect(settingsDropdown).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('setFilter', () => {
      const settingsDropdown = createSettingsDropdown();
      const filterElement = settingsDropdown.findAll('.element').at(1);

      filterElement.trigger('click');

      expect(settingsDropdown.emitted('filterChanged')).toBeTruthy();
      expect(settingsDropdown.emitted().filterChanged[0]).toEqual(['shared']);
    });

    describe('setOrder', () => {
      const settingsDropdown = createSettingsDropdown();
      const filterElement = settingsDropdown.find('.section:nth-child(2) .type:nth-child(3) .element:nth-child(2)');

      filterElement.trigger('click');

      expect(settingsDropdown.emitted('orderChanged')).toBeTruthy();
      expect(settingsDropdown.emitted('orderChanged')[0]).toEqual([{ order: 'name', direction: 'desc' }]);
    });
  });
});

function createSettingsDropdown (
  propsData = {
    section: 'maps',
    filter: 'mine',
    order: 'updated_at',
    orderDirection: 'desc',
    metadata: { total_likes: 10, total_shared: 10, total_locked: 10 }
  }) {
  return mount(SettingsDropdown, {
    mocks: { $t },
    propsData,
    slots: {
      default: filterIcon
    }
  });
}
