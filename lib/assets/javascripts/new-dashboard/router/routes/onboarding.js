// Lazy Pages
const OnboardingWelcome = () => import('new-dashboard/components/Onboarding/distributor/Distributor');
const Wizard = () => import('new-dashboard/components/Onboarding/wizard/Wizard');

const onboarding = [
  {
    path: '/get-started',
    name: 'onboarding',
    components: {
      'onboarding-modal': OnboardingWelcome
    },
    meta: {
      title: () => 'Get Started | CARTO'
    },
    children: [
      {
        path: '/get-started/:onboardingId',
        name: 'onboarding-open',
        components: {
          onboarding: Wizard
        },
        meta: {
          title: () => 'Get Started | CARTO'
        }
      }
    ]
  }
];

export default onboarding;
