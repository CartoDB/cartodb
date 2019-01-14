import { shallowMount } from '@vue/test-utils';
import TrialExpired from 'new-dashboard/pages/TrialExpired';

const $t = key => key;

describe('TrialExpired.vue', () => {
  it('should render correct contents', () => {
    const data = function () {
      return {
        expirationDays: 30,
        addPaymentsURL: 'https://carto.com/account/user/plan'
      };
    };

    const page = shallowMount(TrialExpired, {
      data,
      mocks: {
        $t
      }
    });

    expect(page).toMatchSnapshot();
  });
});
