import { shallowMount } from '@vue/test-utils';
import Footer from 'new-dashboard/components/Onboarding/components/Footer';

const $t = key => key;

describe('Footer.vue', () => {
  it('should render properly', () => {
    const footerComponent = createFooterComponent({
      propsData: {
        currentStep: 2
      }
    });

    expect(footerComponent).toMatchSnapshot();
  });

  it('should render go to dashboard button in last step', () => {
    const footerComponent = createFooterComponent({
      propsData: {
        currentStep: 3
      }
    });

    expect(footerComponent).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('should emit goToStep event when clicking prev button', () => {
      const footerComponent = createFooterComponent({
        propsData: {
          currentStep: 2
        }
      });

      footerComponent.find('button.js-prev').trigger('click');

      expect(footerComponent.emitted().goToStep[0]).toEqual([1]);
    });

    it('should emit goToStep event when clicking next button', () => {
      const footerComponent = createFooterComponent({
        propsData: {
          currentStep: 1
        }
      });

      footerComponent.find('button.js-next').trigger('click');

      expect(footerComponent.emitted().goToStep[0]).toEqual([2]);
    });

    it('should call $router.push when going to home', () => {
      const $router = {
        push: jest.fn()
      };

      const footerComponent = createFooterComponent({
        propsData: {
          currentStep: 3
        },
        mocks: { $router }
      });

      footerComponent.find('button.js-goToDashboard').trigger('click');

      expect($router.push).toHaveBeenCalledWith({name: 'home'});
    });
  });
});

function createFooterComponent (overrides = {}) {
  const defaultSteps = [
    'Fake Step 1',
    'Fake Step 2',
    'Fake Step 3'
  ];

  const footerComponent = shallowMount(Footer, {
    ...overrides,
    propsData: {
      stepNames: defaultSteps,
      ...overrides.propsData
    },
    mocks: {
      $t,
      ...overrides.mocks
    }
  });

  return footerComponent;
}
