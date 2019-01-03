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

const $t = key => key;

describe('QuotaSection.vue', () => {
  it('should render correct contents', () => {
    const quotaSection = shallowMount(QuotaSection, {
      store,
      localVue,
      mocks: {
        $t
      }
    });

    expect(quotaSection).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return all the correct computed variables', () => {
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let availableStorage = quotaSection.vm.availableStorage;
      let remainingStorage = quotaSection.vm.remainingStorage;
      let geocodingUsed = quotaSection.vm.geocodingUsed;
      let geocodingAvailable = quotaSection.vm.geocodingAvailable;
      let routingUsed = quotaSection.vm.routingUsed;
      let routingAvailable = quotaSection.vm.routingAvailable;
      let isolinesUsed = quotaSection.vm.isolinesUsed;
      let isolinesAvailable = quotaSection.vm.isolinesAvailable;
      let usedStorage = quotaSection.vm.usedStorage;
      let amountExponent = quotaSection.vm.amountExponent;

      expect(availableStorage).toBe(1073741824);
      expect(remainingStorage).toBe(1066631168);
      expect(geocodingUsed).toBe(103);
      expect(geocodingAvailable).toBe(1200);
      expect(routingUsed).toBe(54);
      expect(routingAvailable).toBe(102);
      expect(isolinesUsed).toBe(134);
      expect(isolinesAvailable).toBe(1332);
      expect(usedStorage).toBe(7110656);
      expect(amountExponent).toBe(20);
    });

    it('should return correct unit if you give a base two', () => {
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotaSection.vm.getUnit(0);
      let result2 = quotaSection.vm.getUnit(12);
      let result3 = quotaSection.vm.getUnit(20);
      let result4 = quotaSection.vm.getUnit(35);
      let result5 = quotaSection.vm.getUnit(49);
      let result6 = quotaSection.vm.getUnit(51);
      let result7 = quotaSection.vm.getUnit(62);
      let result8 = quotaSection.vm.getUnit(70);

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
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotaSection.vm.getAmountInUnit(0, 0);
      let result2 = quotaSection.vm.getAmountInUnit(10, 0);
      let result3 = quotaSection.vm.getAmountInUnit(2097152, 20);
      let result4 = quotaSection.vm.getAmountInUnit(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });

  describe('Methods', () => {
    it('should return correct base two of the number (ten by ten)', () => {
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotaSection.vm.getExpBaseTwo(0);
      let result2 = quotaSection.vm.getExpBaseTwo(1395864371);
      let result3 = quotaSection.vm.getExpBaseTwo(1363148);

      expect(result1).toBe(0);
      expect(result2).toBe(30);
      expect(result3).toBe(20);
    });

    it('should return correct unit if you give a base two', () => {
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotaSection.vm.getUnit(0);
      let result2 = quotaSection.vm.getUnit(32);
      let result3 = quotaSection.vm.getUnit(12);

      expect(result1).toBe('B');
      expect(result2).toBe('GB');
      expect(result3).toBe('KB');
    });

    it('should divide the number passed by the base two provided', () => {
      const quotaSection = shallowMount(QuotaSection, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotaSection.vm.getAmountInUnit(0, 0);
      let result2 = quotaSection.vm.getAmountInUnit(10, 0);
      let result3 = quotaSection.vm.getAmountInUnit(2097152, 20);
      let result4 = quotaSection.vm.getAmountInUnit(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });
});
