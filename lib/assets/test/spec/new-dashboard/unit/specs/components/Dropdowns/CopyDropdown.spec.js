import { shallowMount } from '@vue/test-utils';
import CopyDropdown from 'new-dashboard/components/Dropdowns/CopyDropdown';

const $t = key => key;

describe('CopyDropdown.vue', () => {
  describe('properties', () => {
    it('should render correct contents', () => {
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });
      expect(copyDropdown).toMatchSnapshot();
    });

    it('should show confirmation message when data is copied', () => {
      document.execCommand = key => true;
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });

      copyDropdown.vm.copyName();

      expect(copyDropdown.vm.copySuccessful).toBe(true);
      expect(copyDropdown).toMatchSnapshot();
    });

    it('should not show confirmation message if data is not copied', () => {
      document.execCommand = key => false;
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });

      copyDropdown.vm.copyName();

      expect(copyDropdown.vm.copySuccessful).toBe(false);
      expect(copyDropdown).toMatchSnapshot();
    });

    it('should handle an error in execCommand', () => {
      document.execCommand = false;
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });

      copyDropdown.vm.copyName();

      expect(copyDropdown.vm.copySuccessful).toBe(false);
      expect(copyDropdown).toMatchSnapshot();
    });

    it('should hide the dropdown if isVisible is set to false', () => {
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });

      copyDropdown.vm.isVisible = false;

      expect(copyDropdown).toMatchSnapshot();
    });

    it('should show copy message again after the method resetDropdown is called', () => {
      document.execCommand = key => true;
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });

      copyDropdown.vm.copyName();
      copyDropdown.vm.resetDropdown();
      expect(copyDropdown.vm.copySuccessful).toBe(false);
      expect(copyDropdown).toMatchSnapshot();
    });
  });

  describe('watchers', () => {
    it('should run the reset method when isVisible prop is changed to false', () => {
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: true
        },
        mocks: {
          $t
        }
      });
      jest.spyOn(copyDropdown.vm, 'resetDropdown');
      copyDropdown.vm.isVisible = false;

      expect(copyDropdown.vm.resetDropdown).toBeCalled();
    });

    it('should not run the reset method when isVisible prop is changed to true', () => {
      const copyDropdown = shallowMount(CopyDropdown, {
        propsData: {
          textToCopy: 'This is a test',
          isVisible: false
        },
        mocks: {
          $t
        }
      });
      jest.spyOn(copyDropdown.vm, 'resetDropdown');
      copyDropdown.vm.isVisible = true;

      expect(copyDropdown.vm.resetDropdown).not.toBeCalled();
    });
  });
});
