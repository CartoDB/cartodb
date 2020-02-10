import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

const actions = [
  { name: 'Edit info', event: 'editInfo' },
  { name: 'Change Privacy', event: 'changePrivacy' },
  { name: 'Manage Tags', event: 'manageTags' },
  { name: 'Duplicate map', event: 'duplicateMap' },
  { name: 'Lock Map', event: 'lockMap' },
  { name: 'Delete Map', event: 'deleteMap', isDestructive: true }
];

const $t = key => key;

describe('QuickActions.vue', () => {
  it('should render correct contents', () => {
    const quickAction = shallowMount(QuickActions, {
      propsData: { actions },
      mocks: {
        $t
      }
    });

    expect(quickAction).toMatchSnapshot();
  });

  it('should not render options with shouldBeHidden', async () => {
    const componentActions = [
      ...actions,
      { name: 'Hidden Option', event: 'noneAction', shouldBeHidden: true }
    ];

    const quickAction = shallowMount(QuickActions, {
      propsData: { actions: componentActions },
      mocks: {
        $t
      }
    });

    quickAction.setData({ isOpen: true });

    await nextTick();

    expect(quickAction).toMatchSnapshot();
  });

  describe('methods', () => {
    it('should open dropdown and then close it again', async () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions },
        mocks: {
          $t
        }
      });

      expect(quickAction.vm.isOpen).toBe(false);

      quickAction.vm.toggleDropdown();
      await nextTick();
      expect(quickAction.vm.isOpen).toBe(true);
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      await nextTick();
      expect(quickAction).toMatchSnapshot();
    });

    it('should close dropdown', async () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions },
        mocks: {
          $t
        }
      });

      quickAction.vm.closeDropdown();
      await nextTick();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.toggleDropdown();
      await nextTick();
      expect(quickAction).toMatchSnapshot();

      quickAction.vm.closeDropdown();
      await nextTick();
      expect(quickAction).toMatchSnapshot();
    });

    it('should emit the event passed in the argument', async () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions },
        mocks: {
          $t
        }
      });

      quickAction.vm.emitEvent('test-event');
      await nextTick();
      expect(quickAction.emitted('test-event')).toBeTruthy();
      expect(quickAction.emitted('test-event').length).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit only open-quickations event', async () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions },
        mocks: {
          $t
        }
      });
      expect(quickAction.vm.isOpen).toBe(false);
      expect(quickAction.emitted('open')).toBeFalsy();

      quickAction.vm.toggleDropdown();
      await nextTick();
      expect(quickAction.emitted('open')).toBeTruthy();
      expect(quickAction.emitted('open').length).toBe(1);
      expect(quickAction.emitted('close')).toBeFalsy();
    });

    it('should emit close-quickactions event', async () => {
      const quickAction = shallowMount(QuickActions, {
        propsData: { actions },
        mocks: {
          $t
        }
      });

      quickAction.vm.toggleDropdown(); // Opens dropdown
      await nextTick();
      expect(quickAction.vm.isOpen).toBe(true);
      expect(quickAction.emitted('close')).toBeFalsy();

      quickAction.vm.toggleDropdown(); // Closes dropdown
      await nextTick();
      expect(quickAction.emitted('close')).toBeTruthy();
      expect(quickAction.emitted('close').length).toBe(1);

      quickAction.vm.toggleDropdown(); // Opens dropdown
      await nextTick();
      expect(quickAction.emitted('close').length).toBe(1);

      quickAction.vm.closeDropdown();
      await nextTick();
      expect(quickAction.emitted('close').length).toBe(2);
    });
  });
});
