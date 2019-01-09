import { shallowMount } from '@vue/test-utils';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader';

const $t = key => key;

describe('CondensedMapHeader.vue', () => {
  let condensedMapHeader;
  beforeEach(() => {
    condensedMapHeader = createCondensedMapHeader();
  });

  it('should render correct contents', () => {
    expect(condensedMapHeader).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('changeOrder', () => {
      it('should call setOrder with passed order', () => {
        const setOrder = jest.fn();

        const header = createCondensedMapHeader({
          methods: { setOrder }
        });

        header.vm.changeOrder('name');

        expect(setOrder).toHaveBeenCalledWith('name');
      });

      it('should call setOrder with opposite order if passed order was applied already', () => {
        const setOrder = jest.fn();

        const header = createCondensedMapHeader({
          methods: { setOrder }
        });

        header.vm.changeOrder('updated_at');

        expect(setOrder).toHaveBeenCalledWith('updated_at', 'asc');
      });
    });

    describe('getOppositeOrderDirection', () => {
      it('should return asc when passing desc', () => {
        expect(condensedMapHeader.vm.getOppositeOrderDirection('asc')).toBe('desc');
      });

      it('should return desc when passing asc', () => {
        expect(condensedMapHeader.vm.getOppositeOrderDirection('desc')).toBe('asc');
      });
    });

    describe('isOrderApplied', () => {
      it('should return true if order is applied', () => {
        expect(condensedMapHeader.vm.isOrderApplied('updated_at')).toBe(true);
      });
    });

    describe('isReversedOrderApplied', () => {
      it('should return true if reverse order is applied', () => {
        condensedMapHeader.setData({
          order: 'updated_at',
          orderDirection: 'asc'
        });
        expect(condensedMapHeader.vm.isReverseOrderApplied('updated_at')).toBe(true);
      });
    });

    describe('setOrder', () => {
      it("should emit 'changeOrder' event with order and direction", () => {
        condensedMapHeader.vm.setOrder('name', 'asc');
        expect(condensedMapHeader.emitted('orderChanged')[0]).toEqual([
          { direction: 'asc', order: 'name' }
        ]);
      });
    });
  });
});

function createCondensedMapHeader (overridenComponentOptions) {
  return shallowMount(CondensedMapHeader, {
    mocks: {
      $t
    },
    propsData: {
      order: 'updated_at',
      orderDirection: 'desc'
    },
    ...overridenComponentOptions
  });
}
