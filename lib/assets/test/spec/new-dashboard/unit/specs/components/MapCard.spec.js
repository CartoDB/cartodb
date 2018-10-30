import { shallowMount, mount } from '@vue/test-utils';
import visualization from '../fixtures/visualizations';
import MapCard from 'new-dashboard/components/MapCard';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

let $cartoModels;
let $t;

describe('MapCard.vue', () => {
  beforeEach(() => {
    const user = new UserModel({});
    const config = new ConfigModel({});
    $cartoModels = { user, config };
    $t = key => key;
  });

  it('should render correct contents', () => {
    const map = visualization.visualizations[0];
    const mapCard = shallowMount(MapCard, {
      propsData: { map },
      mocks: {
        $cartoModels,
        $t
      }
    });
    expect(mapCard).toMatchSnapshot();
  });

  it('should render description and tags', () => {
    const map = visualization.visualizations[0];
    map.description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    map.tags = ['Hi', 'Hello', 'CARTO Rules'];
    const mapCard = shallowMount(MapCard, {
      propsData: { map },
      mocks: {
        $cartoModels,
        $t
      }
    });
    expect(mapCard).toMatchSnapshot();
  });

  describe('Methods', () => {
    it('should toggle selected state', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.selected).toBe(false);
      mapCard.vm.toggleSelection();
      expect(mapCard.vm.selected).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });

    it('should toggle favorite state', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.$props.map.liked).toBe(true);
      mapCard.vm.toggleFavorite();
      expect(mapCard.vm.$props.map.liked).toBe(false);
      expect(mapCard).toMatchSnapshot();
    });

    it('should toggle mouse hover', () => {
      const map = visualization.visualizations[0];
      const mapCard = mount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.activeHover).toBe(true);
      mapCard.find('.card-select').trigger('mouseover');
      // mapCard.vm.mouseOverChildElement();
      expect(mapCard.vm.activeHover).toBe(false);
      expect(mapCard).toMatchSnapshot();

      // mapCard.vm.mouseOutChildElement();
      mapCard.find('.card-select').trigger('mouseleave');
      expect(mapCard.vm.activeHover).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });

    it('should show thumbnail error', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.isThumbnailErrored).toBe(false);
      mapCard.vm.onThumbnailError();
      expect(mapCard.vm.isThumbnailErrored).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });
  });
});
