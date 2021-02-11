// Lazy Pages
const OnboardingWelcome = () => import('new-dashboard/components/Onboarding/distributor/Distributor');

const onboarding = [
  {
    path: '/get-started',
    name: 'onboarding',
    components: {
      'onboarding-modal': OnboardingWelcome
    },
    meta: {
      title: () => 'Get Started | CARTO'
    }
  }
];

export default onboarding;
