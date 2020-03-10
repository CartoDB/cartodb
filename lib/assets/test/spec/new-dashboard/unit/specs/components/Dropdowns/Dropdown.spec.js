import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Dropdown from 'new-dashboard/components/Dropdowns/Dropdown';

describe('Dropdown.vue', () => {
  it('should render correct contents', () => {
    const dropdown = mount(Dropdown, {
      slots: {
        default: 'Default text'
      }
    });

    expect(dropdown).toMatchSnapshot();
  });

  it('should open dropdown when clicking toggle', async () => {
    const dropdown = mount(Dropdown, {
      slots: {
        default: 'Dropdown Content'
      }
    });

    dropdown.find('.dropdown__toggle').trigger('click');

    await nextTick();

    expect(dropdown).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('closeDropdown', () => {
      it('should close the dropdown', async () => {
        const dropdown = mount(Dropdown, {
          data () { return { isOpen: true }; },
          slots: { default: 'Dropdown Content' }
        });

        await nextTick();

        let dropdownToggle = dropdown.find('.dropdown__toggle');
        let dropdownContent = dropdown.find('.dropdown');

        expect(dropdownToggle.classes()).toEqual(['dropdown__toggle', 'dropdown__toggle--active']);
        expect(dropdownContent.classes()).toEqual(['dropdown', 'is-open']);

        dropdown.vm.closeDropdown();

        await nextTick();

        expect(dropdownToggle.classes()).toEqual(['dropdown__toggle']);
        expect(dropdownContent.classes()).toEqual(['dropdown']);
      });
    });
  });
});
