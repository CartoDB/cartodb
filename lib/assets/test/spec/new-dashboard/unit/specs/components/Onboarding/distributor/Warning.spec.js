import { shallowMount } from '@vue/test-utils';
import Warning from 'new-dashboard/components/Onboarding/distributor/Warning';

const $t = key => key;

describe('Warning.vue', () => {
  it('should render properly', () => {
    const warningComponent = shallowMount(Warning, {
      mocks: { $t }
    });

    expect(warningComponent).toMatchSnapshot();
  });
});
