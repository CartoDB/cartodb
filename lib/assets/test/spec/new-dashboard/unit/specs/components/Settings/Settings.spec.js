import { mount } from '@vue/test-utils';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import { filterIcon } from 'icons';

const $t = key => key;

describe('Settings.vue', () => {
  it('should render correct contents based on filter and order in maps section', () => {
    const settingsDropdown = createSettingsDropdown({
      filter: 'link',
      section: 'maps',
      metadata: {
        total_likes: 10,
        total_shared: 10,
        total_locked: 10
      }
    });
    expect(settingsDropdown).toMatchSnapshot();
  });

  it('should render correct contents based on filter and order in datasets section', () => {
    const settingsDropdown = createSettingsDropdown({
      filter: 'public',
      section: 'datasets',
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
      expect(settingsDropdown.emitted().filterChanged[0]).toEqual(['favorited']);
    });
  });
});

function createSettingsDropdown (
  propsData = {
    section: 'maps',
    filter: 'mine',
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
