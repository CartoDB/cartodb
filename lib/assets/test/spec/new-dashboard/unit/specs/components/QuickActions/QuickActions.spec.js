import { shallowMount } from '@vue/test-utils';
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

const actions = [
  { name: 'Edit info', event: 'editInfo' },
  { name: 'Change Privacy', event: 'changePrivacy' },
  { name: 'Manage Tags', event: 'manageTags' },
  { name: 'Duplicate map', event: 'duplicateMap' },
  { name: 'Lock Map', event: 'lockMap' },
  { name: 'Delete Map', event: 'deleteMap', isDestructive: true }
];

describe('QuickActions.vue', () => {
  it('should render correct contents', () => {
    const quickAction = shallowMount(QuickActions, {
      propsData: { actions }
    });

    expect(quickAction).toMatchSnapshot();
  });

  describe('methods', () => {
    it('should open dropdown and then close it again', () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions }
      });

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();
    });

    it('should close dropdown', () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions }
      });
      quickAction.vm.closeDropdown();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      expect(quickAction).toMatchSnapshot();
      quickAction.vm.closeDropdown();

      expect(quickAction).toMatchSnapshot();
    });

    it('should emit the event passed in the argument', () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions }
      });

      quickAction.vm.doAction('test-event');

      expect(quickAction.emitted('test-event')).toBeTruthy();
      expect(quickAction.emitted('test-event').length).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit only open-quickations event', () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions }
      });
      expect(quickAction.vm.isOpen).toBe(false);
      expect(quickAction.emitted('openQuickactions')).toBeFalsy();

      quickAction.vm.toggleDropdown();

      expect(quickAction.emitted('openQuickactions')).toBeTruthy();
      expect(quickAction.emitted('openQuickactions').length).toBe(1);
      expect(quickAction.emitted('closeQuickactions')).toBeFalsy();
    });

    it('should emit close-quickactions event', () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions }
      });
      quickAction.vm.toggleDropdown(); // Opens dropdown
      expect(quickAction.vm.isOpen).toBe(true);
      expect(quickAction.emitted('closeQuickactions')).toBeFalsy();

      quickAction.vm.toggleDropdown(); // Closes dropdown

      expect(quickAction.emitted('closeQuickactions')).toBeTruthy();
      expect(quickAction.emitted('closeQuickactions').length).toBe(1);
      quickAction.vm.toggleDropdown(); // Opens dropdown
      expect(quickAction.emitted('closeQuickactions').length).toBe(1);
      quickAction.vm.closeDropdown();
      expect(quickAction.emitted('closeQuickactions').length).toBe(2);
    });
  });
});
