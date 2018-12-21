import { shallowMount } from '@vue/test-utils';
import datasets from '../../../fixtures/datasets';
import DatasetsList from 'new-dashboard/pages/Home/DatasetsSection/DatasetList';

const $t = key => key;

describe('DatasetsList.vue', () => {
  it('should render properly', () => {
    const datasetsList = createDatasetsList({
      propsData: {
        datasets: datasets.visualizations,
        appliedOrder: 'updated_at',
        appliedOrderDirection: 'desc',
        isFetchingDatasets: false
      }
    });
    expect(datasetsList).toMatchSnapshot();
  });

  describe('Methods', () => {
    describe('applyOrder', () => {
      it('should emit an event with order options', () => {
        const datasetsList = createDatasetsList();

        datasetsList.vm.applyOrder({ order: 'updated_at', direction: 'desc' });

        expect(datasetsList.emitted('applyOrder')[0]).toEqual([{ order: 'updated_at', direction: 'desc' }]);
      });
    });
  });
});

function createDatasetsList (options = {}) {
  return shallowMount(DatasetsList, {
    ...options,
    mocks: {
      $t,
      ...options.mocks
    }
  });
}
