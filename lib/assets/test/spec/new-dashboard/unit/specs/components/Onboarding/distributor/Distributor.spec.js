import { shallowMount } from '@vue/test-utils';
import Distributor from 'new-dashboard/components/Onboarding/distributor/Distributor';

const $t = key => key;

describe('Distributor.vue', () => {
  it('should render properly', () => {
    const $store = {
      getters: {
        'user/hasEngine': true
      }
    };

    const distributorComponent = createDistributorComponent({
      mocks: {
        $store
      }
    });

    expect(distributorComponent).toMatchSnapshot();
  });

  it('should render engine warning for no engine users', () => {
    const distributorComponent = createDistributorComponent();
    expect(distributorComponent).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('should call $router.push when opening any onboarding', () => {
      const $router = {
        push: jest.fn()
      };

      const Selector = {
        render: h => h('div'),
        name: 'Selector'
      };

      const distributorComponent = createDistributorComponent({
        mocks: { $router },
        stubs: { Selector }
      });

      distributorComponent.find({ name: 'Selector' }).trigger('click');

      expect($router.push).toHaveBeenCalledWith({
        hash: '#step-1',
        name: 'onboarding-open',
        params: { onboardingId: 'carto-vl' }
      });
    });
  });

  it('should call $router.push when closing modal', () => {
    const $router = {
      push: jest.fn()
    };

    const distributorComponent = createDistributorComponent({
      mocks: { $router }
    });

    distributorComponent.vm.closeModal();

    expect($router.push).toHaveBeenCalledWith({ name: 'home' });
  });
});

function createDistributorComponent (overrides = {}) {
  const $store = {
    getters: {
      'user/hasEngine': false
    }
  };

  const distributorComponent = shallowMount(Distributor, {
    ...overrides,
    mocks: {
      $t,
      $store,
      ...overrides.mocks
    }
  });

  return distributorComponent;
}
