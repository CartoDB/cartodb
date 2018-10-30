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

      expect(mapCard.vm.mapThumbnailUrl).toMatch(/^http(s)?:\/\/.+\/api\/v1\/map\/static\/named\/tpl_f8e13983_bb08_4ca9_b64a_f34e76fe077a\/600\/280\.png\?auth_token=feZhHEP4vJEbTbF3PEgyvA&auth_token=00580a1519bad8a50dba717dc0bb82bd357084c01212ba90f6058a226457e77d$/);
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

      expect(mapCard.vm.vizUrl).toBe('https://team.carto.com/u/cillas/viz/f8e13983-bb08-4ca9-b64a-f34e76fe077a');
    });
  });
});
