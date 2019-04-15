import { shallowMount } from '@vue/test-utils';
import Header from 'new-dashboard/components/Onboarding/components/Header';

describe('Header.vue', () => {
  it('should render properly', () => {
    const headerComponent = createHeaderComponent({
      propsData: {
        currentStep: 2
      }
    });

    expect(headerComponent).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('should emit goToStep event when clicking first step button', () => {
      const headerComponent = createHeaderComponent({
        propsData: {
          currentStep: 2
        }
      });

      headerComponent.find('a.step-1').trigger('click');

      expect(headerComponent.emitted().goToStep[0]).toEqual([1]);
    });

    it('should add "current" class to last step', () => {
      const headerComponent = createHeaderComponent({
        propsData: {
          currentStep: 3
        }
      });

      expect(headerComponent).toMatchSnapshot();
    });
  });
});

function createHeaderComponent (overrides = {}) {
  const defaultSteps = [
    'Fake Step 1',
    'Fake Step 2',
    'Fake Step 3'
  ];

  const headerComponent = shallowMount(Header, {
    ...overrides,
    propsData: {
      stepNames: defaultSteps,
      ...overrides.propsData
    },
    mocks: {
      ...overrides.mocks
    }
  });

  return headerComponent;
}
