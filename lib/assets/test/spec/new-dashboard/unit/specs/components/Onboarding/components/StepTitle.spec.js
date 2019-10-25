import { shallowMount } from '@vue/test-utils';
import StepTitle from 'new-dashboard/components/Onboarding/components/StepTitle';

describe('StepTitle.vue', () => {
  it('should render properly', () => {
    const stepTitleComponent = shallowMount(StepTitle, {
      propsData: {
        title: 'Fake step title'
      },
      slots: {
        icon: '<img src="/fake-icon-url"/>'
      }
    });

    expect(stepTitleComponent).toMatchSnapshot();
  });
});
