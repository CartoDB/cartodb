import { shallowMount } from '@vue/test-utils';
import QuickActions from 'new-dashboard/components/QuickActions';

describe('QuickActions.vue', () => {
  it('should render correct contents', () => {
    const quickAction = shallowMount(QuickActions);

    expect(quickAction).toMatchSnapshot();
  });

  describe('methods', () => {
    it('should open dropdown and then close it again', () => {
      const quickAction = shallowMount(QuickActions);

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();
    });

    it('should close dropdown', () => {
      const quickAction = shallowMount(QuickActions);
      quickAction.vm.closeDropdown();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();
      quickAction.vm.closeDropdown();

      expect(quickAction).toMatchSnapshot();
    });
  });

  describe('events', () => {
    it('should emit only open-quickations event', () => {
      const quickAction = shallowMount(QuickActions);
      expect(quickAction.vm.isOpen).toBe(false);
      expect(quickAction.emitted('open-quickactions')).toBeFalsy();

      quickAction.vm.toggleDropdown();

      expect(quickAction.emitted('open-quickactions')).toBeTruthy();
      expect(quickAction.emitted('open-quickactions').length).toBe(1);
      expect(quickAction.emitted('close-quickactions')).toBeFalsy();
    });

    it('should emit close-quickactions event', () => {
      const quickAction = shallowMount(QuickActions);
      quickAction.vm.toggleDropdown(); // Opens dropdown
      expect(quickAction.vm.isOpen).toBe(true);
      expect(quickAction.emitted('close-quickactions')).toBeFalsy();

      quickAction.vm.toggleDropdown(); // Closes dropdown

      expect(quickAction.emitted('close-quickactions')).toBeTruthy();
      expect(quickAction.emitted('close-quickactions').length).toBe(1);
      quickAction.vm.toggleDropdown(); // Opens dropdown
      expect(quickAction.emitted('close-quickactions').length).toBe(1);
      quickAction.vm.closeDropdown();
      expect(quickAction.emitted('close-quickactions').length).toBe(2);
    });
  });
});
