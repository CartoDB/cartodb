import { shallowMount } from '@vue/test-utils';
import DatasetListHeader from 'new-dashboard/components/Dataset/DatasetListHeader';

const $t = key => key;

describe('DatasetListHeader.vue', () => {
  let datasetListHeader;
  beforeEach(() => {
    datasetListHeader = createDatasetListHeader();
  });

  it('should render correct contents', () => {
    expect(datasetListHeader).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('changeOrder', () => {
      it('should call setOrder with passed order', () => {
        const setOrder = jest.fn();

        const header = createDatasetListHeader({
          methods: { setOrder }
        });

        header.vm.changeOrder('updated_at');

        expect(setOrder).toHaveBeenCalledWith('updated_at');
      });

      it('should call setOrder with opposite order if passed order was applied already', () => {
        const setOrder = jest.fn();

        const header = createDatasetListHeader({
          methods: { setOrder }
        });

        header.vm.changeOrder('size');

        expect(setOrder).toHaveBeenCalledWith('size', 'asc');
      });
    });

    describe('getOppositeOrderDirection', () => {
      it('should return asc when passing desc', () => {
        expect(datasetListHeader.vm.getOppositeOrderDirection('asc')).toBe('desc');
      });

      it('should return desc when passing asc', () => {
        expect(datasetListHeader.vm.getOppositeOrderDirection('desc')).toBe('asc');
      });
    });

    describe('isOrderApplied', () => {
      it('should return true if order is applied', () => {
        expect(datasetListHeader.vm.isOrderApplied('size')).toBe(true);
      });
    });

    describe('isReversedOrderApplied', () => {
      it('should return true if reverse order is applied', () => {
        datasetListHeader.setData({
          order: 'size',
          orderDirection: 'asc'
        });
        expect(datasetListHeader.vm.isReverseOrderApplied('size')).toBe(true);
      });
    });

    describe('setOrder', () => {
      it("should emit 'changeOrder' event with order and direction", () => {
        datasetListHeader.vm.setOrder('updated_at', 'asc');
        expect(datasetListHeader.emitted('changeOrder')[0]).toEqual([
          { direction: 'asc', order: 'updated_at' }
        ]);
      });
    });
  });
});

function createDatasetListHeader (overridenComponentOptions) {
  return shallowMount(DatasetListHeader, {
    mocks: {
      $t
    },
    propsData: {
      order: 'size',
      orderDirection: 'desc'
    },
    ...overridenComponentOptions
  });
}
