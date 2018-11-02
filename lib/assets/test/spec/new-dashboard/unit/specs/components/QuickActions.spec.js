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
});
