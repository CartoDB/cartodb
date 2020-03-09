import { shallowMount } from '@vue/test-utils';
import OnboardingButton from 'new-dashboard/components/Onboarding/OnboardingButton';

const $t = key => key;

describe('OnboardingButton.vue', () => {
  it('should render properly', () => {
    const onboardingButton = shallowMount(OnboardingButton, {
      propsData: {
        isFirstTimeViewingDashboard: false
      },
      mocks: { $t }
    });

    expect(onboardingButton).toMatchSnapshot();
  });

  it('should set button--cta with extended text if isFirstTimeViewingDashboard is true', () => {
    const onboardingButton = shallowMount(OnboardingButton, {
      propsData: {
        isFirstTimeViewingDashboard: true
      },
      mocks: { $t }
    });

    expect(onboardingButton).toMatchSnapshot();
  });

  it('should not contain not-visited class after opening onboarding', () => {
    const $router = {
      push: jest.fn()
    };

    const onboardingButton = shallowMount(OnboardingButton, {
      propsData: {
        isFirstTimeViewingDashboard: false
      },
      mocks: { $t, $router }
    });

    onboardingButton.vm.openOnboarding();

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

    it('should call updateHasVisitedOnboarding with true when opening onboarding', () => {
      const $router = {
        push: jest.fn()
      };
      const updateHasVisitedOnboarding = jest.fn();

      const onboardingButton = shallowMount(OnboardingButton, {
        mocks: { $t, $router },
        methods: { updateHasVisitedOnboarding }
      });

      onboardingButton.vm.openOnboarding();

      expect(updateHasVisitedOnboarding).toHaveBeenCalledWith(true);
    });
  });
});
