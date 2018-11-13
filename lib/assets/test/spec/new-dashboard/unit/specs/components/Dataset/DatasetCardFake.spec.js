import { shallowMount } from '@vue/test-utils';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';

describe('DatasetCardFake.vue', () => {
  it('should render correct contents', () => {
    const datasetCardFake = shallowMount(DatasetCardFake);
    expect(datasetCardFake).toMatchSnapshot();
  });
});
