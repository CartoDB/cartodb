import { shallowMount } from '@vue/test-utils';
import EmptyState from 'new-dashboard/components/States/EmptyState';

describe('EmptyState.vue', () => {
  it('should render correctly the empty state box', () => {
    const text = 'There are no maps here.';

    const emptyState = shallowMount(EmptyState, {
      propsData: { text },
      slots: {
        default: '<img src="test.svg"/>'
      }
    });

    expect(emptyState).toMatchSnapshot();
  });
});
