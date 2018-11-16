import { shallowMount } from '@vue/test-utils';
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';

let actions;

describe('BulkActions.vue', () => {
  beforeEach(() => {
    actions = [
      { name: 'Test Action', event: 'testEvent' }
    ];
  });

  it('should render correct contents', () => {
    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    expect(bulkActions).toMatchSnapshot();
  });

  it('should not render option if shouldBeHidden is true', () => {
    actions.push({ name: 'Hidden action', shouldBeHidden: true });

    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    expect(bulkActions).toMatchSnapshot();
  });

  it('should emit an event when any action button is clicked', () => {
    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    const actionButton = bulkActions.find('.bulk-actions__button');

    actionButton.trigger('click');

    expect(bulkActions.emitted('testEvent')).toBeTruthy();
  });

  it('should emit the designated test event', () => {
    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    bulkActions.vm.emitEvent('testEvent');
    expect(bulkActions.emitted('testEvent').length).toBe(1);
  });
});
