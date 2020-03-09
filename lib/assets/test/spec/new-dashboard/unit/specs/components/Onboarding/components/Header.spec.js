import { shallowMount } from '@vue/test-utils';
import Header from 'new-dashboard/components/Onboarding/components/Header';

describe('Header.vue', () => {
  it('should render properly when the tutorial has several steps', () => {
    const headerComponent = createHeaderComponent({
      propsData: {
        currentStep: 2
      }
    });

    expect(headerComponent).toMatchSnapshot();
  });

  it('should render properly when the tutorial has only one step', () => {
    const headerComponent = createHeaderComponent({
      propsData: {
        stepNames: ['Fake Step 1'],
        currentStep: 1
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

      const step3 = headerComponent.find('.step-3 .breadcrumbs__checkpoint');
      expect(step3.classes()).toContain('current');
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
