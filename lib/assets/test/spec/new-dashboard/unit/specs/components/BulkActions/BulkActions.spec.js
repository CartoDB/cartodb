import { shallowMount } from '@vue/test-utils';
import BulkActions from 'new-dashboard/components/BulkActions/BulkActions';

let actions;

describe('BulkActions.vue', () => {
  beforeEach(() => {
    actions = [
      { name: 'Test Action', event: 'testEvent', shouldShow: true }
    ];
  });

  it('should render correct contents', () => {
    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    expect(bulkActions).toMatchSnapshot();
  });

  it('should not render option if shouldShow is false', () => {
    actions.push({ name: 'Hidden action', shouldShow: false });

    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    expect(bulkActions).toMatchSnapshot();
  });

  it('should emit an event when any action button is clicked', () => {
    const bulkActions = shallowMount(BulkActions, { propsData: { actions } });
    const actionButton = bulkActions.find('.bulk-actions__button');

    actionButton.trigger('click');

    expect(bulkActions.emitted('testEvent')).toBeTruthy();
  });
});
