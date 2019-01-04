import { shallowMount } from '@vue/test-utils';
import LoadingState from 'new-dashboard/components/States/LoadingState';

describe('LoadingState.vue', () => {
  it('should render correctly the empty state box', () => {
    const text = 'fake_loading_text';

    const LoadingStateWrapper = shallowMount(LoadingState, {
      propsData: { text }
    });

    expect(LoadingStateWrapper).toMatchSnapshot();
  });
});
