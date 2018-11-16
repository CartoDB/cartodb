import { shallowMount } from '@vue/test-utils';
import DatasetListHeader from 'new-dashboard/components/Dataset/DatasetListHeader';

const $t = key => key;

describe('DatasetListHeader.vue', () => {
  it('should render correct contents', () => {
    const datasetListHeader = shallowMount(DatasetListHeader, {
      mocks: {
        $t
      }
    });

    expect(datasetListHeader).toMatchSnapshot();
  });
});
