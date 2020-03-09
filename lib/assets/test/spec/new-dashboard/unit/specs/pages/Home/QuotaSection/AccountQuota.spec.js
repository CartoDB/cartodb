import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import usersArray from '../../../fixtures/users';
import AccountQuota from 'new-dashboard/pages/Home/QuotaSection/AccountQuota';

const localVue = createLocalVue();
localVue.use(Vuex);

const apiKeysData = {
  count: 2
};

let store = new Vuex.Store({
  state: {
    user: usersArray[1],
    client: {
      getApiKeys: (_, callback) => callback(null, null, apiKeysData)
    }
  }
});

const $tc = key => key;
const $t = key => key;

describe('AccountQuota.vue', () => {
  it('should render correct contents', () => {
    const accountQuota = shallowMount(AccountQuota, {
      store,
      localVue,
      mocks: {
        $tc, $t
      }
    });

    expect(accountQuota).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return all the correct computed variables', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      const availableStorage = accountQuota.vm.availableStorage;
      const remainingStorage = accountQuota.vm.remainingStorage;
      const availablePublicMaps = accountQuota.vm.availablePublicMaps;
      const linkMapsTotal = accountQuota.vm.linkMapsTotal;
      const passwordMapsTotal = accountQuota.vm.passwordMapsTotal;
      const publicMapsTotal = accountQuota.vm.publicMapsTotal;
      const availableDatasets = accountQuota.vm.availableDatasets;
      const usedDatasets = accountQuota.vm.usedDatasets;
      const availableApiKeys = accountQuota.vm.availableApiKeys;
      const planAccountType = accountQuota.vm.planAccountType;
      const availablePrivateMaps = accountQuota.vm.availablePrivateMaps;

      const usedStorage = accountQuota.vm.usedStorage;
      const amountExponent = accountQuota.vm.amountExponent;
      const usedPublicMaps = accountQuota.vm.usedPublicMaps;
      const hasTableLimits = accountQuota.vm.hasTableLimits;
      const hasPublicMapLimits = accountQuota.vm.hasPublicMapLimits;
      const hasApiKeysLimits = accountQuota.vm.hasApiKeysLimits;

      expect(availableStorage).toBe(1073741824);
      expect(remainingStorage).toBe(1066631168);
      expect(availablePublicMaps).toBe(10);
      expect(linkMapsTotal).toBe(2);
      expect(passwordMapsTotal).toBe(3);
      expect(publicMapsTotal).toBe(2);
      expect(availableDatasets).toBe(40);
      expect(usedDatasets).toBe(12);
      expect(availableApiKeys).toBe(3);
      expect(planAccountType).toBe('Individual');
      expect(availablePrivateMaps).toBe(0);

      expect(usedStorage).toBe(7110656);
      expect(amountExponent).toBe(20);
      expect(usedPublicMaps).toBe(7);
      expect(hasTableLimits).toBe(true);
      expect(hasPublicMapLimits).toBe(true);
      expect(hasApiKeysLimits).toBe(true);
    });

    it('should return correct unit if you give a base two', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      let result1 = accountQuota.vm.getUnit(0);
      let result2 = accountQuota.vm.getUnit(12);
      let result3 = accountQuota.vm.getUnit(20);
      let result4 = accountQuota.vm.getUnit(35);
      let result5 = accountQuota.vm.getUnit(49);
      let result6 = accountQuota.vm.getUnit(51);
      let result7 = accountQuota.vm.getUnit(62);
      let result8 = accountQuota.vm.getUnit(70);

      expect(result1).toBe('B');
      expect(result2).toBe('KB');
      expect(result3).toBe('MB');
      expect(result4).toBe('GB');
      expect(result5).toBe('TB');
      expect(result6).toBe('PB');
      expect(result7).toBe('EB');
      expect(result8).toBe('?');
    });

    it('should divide the number passed by the base two provided', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      let result1 = accountQuota.vm.getAmountInUnit(0, 0);
      let result2 = accountQuota.vm.getAmountInUnit(10, 0);
      let result3 = accountQuota.vm.getAmountInUnit(2097152, 20);
      let result4 = accountQuota.vm.getAmountInUnit(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });

  describe('Methods', () => {
    it('should return correct base two of the number (ten by ten)', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      let result1 = accountQuota.vm.getExpBaseTwo(0);
      let result2 = accountQuota.vm.getExpBaseTwo(1395864371);
      let result3 = accountQuota.vm.getExpBaseTwo(1363148);

      expect(result1).toBe(0);
      expect(result2).toBe(30);
      expect(result3).toBe(20);
    });

    it('should return correct unit if you give a base two', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      let result1 = accountQuota.vm.getUnit(0);
      let result2 = accountQuota.vm.getUnit(32);
      let result3 = accountQuota.vm.getUnit(12);

      expect(result1).toBe('B');
      expect(result2).toBe('GB');
      expect(result3).toBe('KB');
    });

    it('should divide the number passed by the base two provided', () => {
      const accountQuota = shallowMount(AccountQuota, {
        store,
        localVue,
        mocks: {
          $tc, $t
        }
      });

      let result1 = accountQuota.vm.getAmountInUnit(0, 0);
      let result2 = accountQuota.vm.getAmountInUnit(10, 0);
      let result3 = accountQuota.vm.getAmountInUnit(2097152, 20);
      let result4 = accountQuota.vm.getAmountInUnit(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });
});
