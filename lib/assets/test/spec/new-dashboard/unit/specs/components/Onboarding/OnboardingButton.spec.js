import { shallowMount } from '@vue/test-utils';
import OnboardingButton from 'new-dashboard/components/Onboarding/OnboardingButton';

const $t = key => key;

describe('OnboardingButton.vue', () => {
  it('should render properly', () => {
    const onboardingButton = shallowMount(OnboardingButton, {
      mocks: { $t }
    });

    expect(onboardingButton).toMatchSnapshot();
  });

  it('should set button--cta if isFirstTimeViewingDashboard is true', () => {
    const onboardingButton = shallowMount(OnboardingButton, {
      propsData: {
        isFirstTimeViewingDashboard: true
      },
      mocks: { $t }
    });

    expect(onboardingButton).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('should call router.push when opening onboarding', () => {
      const $router = {
        push: jest.fn()
      };

      const onboardingButton = shallowMount(OnboardingButton, {
        mocks: { $t, $router }
      });

      onboardingButton.vm.openOnboarding();

      expect($router.push).toHaveBeenCalledWith({ name: 'onboarding' });
    });
  });
});
