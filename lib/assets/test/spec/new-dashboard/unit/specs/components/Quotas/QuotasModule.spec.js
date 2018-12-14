import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import usersArray from '../../fixtures/users';
import QuotasModule from 'new-dashboard/components/Quotas/QuotasModule';

const localVue = createLocalVue();
localVue.use(Vuex);

let store = new Vuex.Store({
  state: {
    user: usersArray[2]
  }
});

const $t = key => key;

describe('QuotasModule.vue', () => {
  it('should render correct contents', () => {
    const quotasModule = shallowMount(QuotasModule, {
      store,
      localVue,
      mocks: {
        $t
      }
    });

    expect(quotasModule).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return all the correct computed variables', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let availableStoarage = quotasModule.vm.availableStorage;
      let remainingStorage = quotasModule.vm.remainingStorage;
      let geocodingUsed = quotasModule.vm.geocodingUsed;
      let geocodingAvailable = quotasModule.vm.geocodingAvailable;
      let routingUsed = quotasModule.vm.routingUsed;
      let routingAvailable = quotasModule.vm.routingAvailable;
      let isolinesUsed = quotasModule.vm.isolinesUsed;
      let isolinesAvailable = quotasModule.vm.isolinesAvailable;
      let usedStorage = quotasModule.vm.usedStorage;
      let getBaseTwo = quotasModule.vm.getBaseTwo;

      expect(availableStoarage).toBe(1073741824);
      expect(remainingStorage).toBe(1066631168);
      expect(geocodingUsed).toBe(103);
      expect(geocodingAvailable).toBe(1200);
      expect(routingUsed).toBe(54);
      expect(routingAvailable).toBe(102);
      expect(isolinesUsed).toBe(134);
      expect(isolinesAvailable).toBe(1332);
      expect(usedStorage).toBe(7110656);
      expect(getBaseTwo).toBe(20);
    });

    it('should return correct unit if you give a base two', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotasModule.vm.getUnitFromBaseTwo(0);
      let result2 = quotasModule.vm.getUnitFromBaseTwo(12);
      let result3 = quotasModule.vm.getUnitFromBaseTwo(20);
      let result4 = quotasModule.vm.getUnitFromBaseTwo(35);
      let result5 = quotasModule.vm.getUnitFromBaseTwo(49);
      let result6 = quotasModule.vm.getUnitFromBaseTwo(51);
      let result7 = quotasModule.vm.getUnitFromBaseTwo(62);
      let result8 = quotasModule.vm.getUnitFromBaseTwo(70);

      expect(result1).toBe('B');
      expect(result2).toBe('Kb');
      expect(result3).toBe('MB');
      expect(result4).toBe('GB');
      expect(result5).toBe('TB');
      expect(result6).toBe('PB');
      expect(result7).toBe('EB');
      expect(result8).toBe('?');
    });

    it('should divide the number passed by the base two provided', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotasModule.vm.divideBaseTwo(0, 0);
      let result2 = quotasModule.vm.divideBaseTwo(10, 0);
      let result3 = quotasModule.vm.divideBaseTwo(2097152, 20);
      let result4 = quotasModule.vm.divideBaseTwo(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });

  describe('Methods', () => {
    it('should return correct base two of the number (ten by ten)', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotasModule.vm.baseTwoRepresentation(0);
      let result2 = quotasModule.vm.baseTwoRepresentation(1395864371);
      let result3 = quotasModule.vm.baseTwoRepresentation(1363148);

      expect(result1).toBe(0);
      expect(result2).toBe(30);
      expect(result3).toBe(20);
    });

    it('should return correct unit if you give a base two', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotasModule.vm.getUnitFromBaseTwo(0);
      let result2 = quotasModule.vm.getUnitFromBaseTwo(32);
      let result3 = quotasModule.vm.getUnitFromBaseTwo(12);

      expect(result1).toBe('B');
      expect(result2).toBe('GB');
      expect(result3).toBe('Kb');
    });

    it('should divide the number passed by the base two provided', () => {
      const quotasModule = shallowMount(QuotasModule, {
        store,
        localVue,
        mocks: {
          $t
        }
      });

      let result1 = quotasModule.vm.divideBaseTwo(0, 0);
      let result2 = quotasModule.vm.divideBaseTwo(10, 0);
      let result3 = quotasModule.vm.divideBaseTwo(2097152, 20);
      let result4 = quotasModule.vm.divideBaseTwo(132070244352, 30);

      expect(result1).toBe(0);
      expect(result2).toBe(10);
      expect(result3).toBe(2);
      expect(result4).toBe(123);
    });
  });
});
