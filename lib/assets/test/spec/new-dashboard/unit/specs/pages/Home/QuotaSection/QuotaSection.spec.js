import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import usersArray from '../../../fixtures/users';
import QuotaSection from 'new-dashboard/pages/Home/QuotaSection/QuotaSection';

const localVue = createLocalVue();
localVue.use(Vuex);

let store = new Vuex.Store({
  state: {
    user: usersArray[2]
  }
});

const $tc = key => key;
const $t = key => key;

describe('QuotaSection.vue', () => {
  it('should render correct contents', () => {
    const quotaSection = shallowMount(QuotaSection, {
      store,
      localVue,
      mocks: {
        $tc, $t
      }
    });

    expect(quotaSection).toMatchSnapshot();
  });
});
