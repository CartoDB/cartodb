import { shallowMount, mount } from '@vue/test-utils';
import visualization from '../fixtures/visualizations';
import usersArray from '../fixtures/users';
import MapCard from 'new-dashboard/components/MapCard';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

let $cartoModels;
const $t = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

describe('MapCard.vue', () => {
  beforeEach(() => {
    $cartoModels = configCartoModels();
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

  it('should show the map is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
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
      const map = visualization.visualizations[1];
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

      expect(mapCard.vm.activeHover).toBe(false);
      expect(mapCard).toMatchSnapshot();

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

  describe('Computed', () => {
    it('should return correct css class', () => {
      const map = visualization.visualizations[0];
      map.privacy = 'PRIVATE';
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      map.privacy = 'PUBLIC';
      const mapCard2 = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      const result1 = mapCard.vm.privacyIcon;
      const result2 = mapCard2.vm.privacyIcon;

      expect(result1).toBe('icon--private');
      expect(result2).toBe('icon--public');
    });

    it('should return correct map thumbnail', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.mapThumbnailUrl).toBe('http://hello.example.com/api/v1/map/static/named/tpl_e97e0001_f1c2_425e_8c9b_0fb28da59200/600/280.png');
    });

    it('should return correct map url', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.vizUrl).toBe('http://example.com/viz/e97e0001-f1c2-425e-8c9b-0fb28da59200');
    });
  });
});
