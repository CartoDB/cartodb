import { shallowMount } from '@vue/test-utils';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';

describe('MapCardFake.vue', () => {
  it('should render by default the simpleMapCardFake', () => {
    const mapCardFake = shallowMount(MapCardFake);
    expect(mapCardFake).toMatchSnapshot();
  });

  it('should render the simpleMapCardFake if condensed is false', () => {
    const mapCardFake = shallowMount(MapCardFake, {
      propsData: {
        condensed: false
      }
    });
    expect(mapCardFake).toMatchSnapshot();
  });

  it('should render the condensedMapCardFake if condensed is true', () => {
    const mapCardFake = shallowMount(MapCardFake, {
      propsData: {
        condensed: true
      }
    });
    expect(mapCardFake).toMatchSnapshot();
  });
});
