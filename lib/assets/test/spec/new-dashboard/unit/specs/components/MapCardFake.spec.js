import { shallowMount } from '@vue/test-utils';
import MapCardFake from 'new-dashboard/components/MapCardFake';

describe('MapCardFake.vue', () => {
  it('should render correct contents', () => {
    const mapCardFake = shallowMount(MapCardFake);
    expect(mapCardFake).toMatchSnapshot();
  });
});
