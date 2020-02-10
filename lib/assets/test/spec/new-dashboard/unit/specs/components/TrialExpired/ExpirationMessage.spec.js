import { shallowMount } from '@vue/test-utils';
import ExpirationMessage from 'new-dashboard/components/TrialExpired/ExpirationMessage';

describe('ExpirationMessage.vue', () => {
  it('should render correctly with trial expired date', () => {
    const expirationMessage = createExpirationMessageComponent();
    expect(expirationMessage).toMatchSnapshot();
  });

  it('should render correctly without trial expired date', () => {
    const $store = {
      state: {
        user: { trial_ends_at: null }
      }
    };

    const expirationMessage = createExpirationMessageComponent({
      mocks: { $store }
    });

    expect(expirationMessage).toMatchSnapshot();
  });

  describe('Computed Variables', () => {
    it('humanReadableExpirationDate', () => {
      const expirationMessage = createExpirationMessageComponent();
      expect(expirationMessage.vm.humanReadableExpirationDate).toBe('January 10, 2019');
    });
  });

  describe('Methods', () => {
    it('deleteAccount: should open delete account modal', () => {
      const modalMock = {
        show: jest.fn()
      };

      const expirationMessage = createExpirationMessageComponent({
        mocks: { $modal: modalMock }
      });

      expirationMessage.vm.deleteAccount();

      const styleProps = { width: '100%', height: '100%' };
      const componentProps = {
        components: {
          DeleteAccount: expect.any(Object),
          Dialog: expect.any(Object)
        },
        template: `
        <Dialog @close="$emit('close')">
          <DeleteAccount @close="$emit('close')"/>
        </Dialog>`
      };

      expect(modalMock.show).toBeCalledWith(
        componentProps,
        {},
        styleProps
      );
    });
  });
});

function createExpirationMessageComponent (propertiesToOverride = {}) {
  const $store = {
    state: {
      user: { trial_ends_at: '2019-01-10T10:00:00.000Z' }
    }
  };

  const mocks = {
    $t: key => key,
    $store,
    ...propertiesToOverride.mocks
  };

  console.log(mocks);

  return shallowMount(ExpirationMessage, {
    propsData: {
      expirationDays: 10,
      upgradeURL: 'https://user.carto.com/plan'
    },
    ...propertiesToOverride,
    mocks
  });
}
