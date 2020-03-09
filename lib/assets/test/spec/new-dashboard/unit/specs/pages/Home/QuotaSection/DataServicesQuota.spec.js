import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import usersArray from '../../../fixtures/users';
import DataServicesQuota from 'new-dashboard/pages/Home/QuotaSection/DataServicesQuota';

const localVue = createLocalVue();
localVue.use(Vuex);

let store = new Vuex.Store({
  state: {
    user: usersArray[2]
  }
});

const $tc = key => key;
const $t = key => key;

describe('DataServicesQuota.vue', () => {
  it('should render correct contents', () => {
    const dataServicesQuota = shallowMount(DataServicesQuota, {
      store,
      localVue,
      mocks: {
        $tc, $t
      }
    });

    expect(dataServicesQuota).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return all the correct computed variables', () => {
      const dataServicesQuota = shallowMount(DataServicesQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      const geocodingUsed = dataServicesQuota.vm.geocodingUsed;
      const geocodingAvailable = dataServicesQuota.vm.geocodingAvailable;
      const routingUsed = dataServicesQuota.vm.routingUsed;
      const routingAvailable = dataServicesQuota.vm.routingAvailable;
      const isolinesUsed = dataServicesQuota.vm.isolinesUsed;
      const isolinesAvailable = dataServicesQuota.vm.isolinesAvailable;

      expect(geocodingUsed).toBe(103);
      expect(geocodingAvailable).toBe(1200);
      expect(routingUsed).toBe(54);
      expect(routingAvailable).toBe(102);
      expect(isolinesUsed).toBe(134);
      expect(isolinesAvailable).toBe(1332);
    });
  });
});
