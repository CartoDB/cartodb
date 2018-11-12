import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import visualization from '../fixtures/visualizations';
import usersArray from '../fixtures/users';
import MapCard from 'new-dashboard/components/MapCard';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const localVue = createLocalVue();
localVue.use(Vuex);

let $cartoModels, actions, store;
const $t = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

describe('MapCard.vue', () => {
  beforeEach(() => {
    $cartoModels = configCartoModels();

    actions = {
      'maps/deleteLike': jest.fn(),
      'maps/like': jest.fn()
    };

    store = new Vuex.Store({
      actions
    });
  });

  it('should render correct contents', () => {
    const map = visualization.visualizations[0];
    const mapCard = shallowMount(MapCard, {
      propsData: { map, isSelected: true },
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
    const map = {...visualization.visualizations[0]};
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

  it('should render description and tag dropdown', () => {
    const map = {...visualization.visualizations[0]};
    map.description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    map.tags = ['Hi', 'Hello', 'CARTO Rules', 'Shows dropdown'];
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
      expect(mapCard.vm.isSelected).toBe(false);

      mapCard.vm.toggleSelection();

      expect(mapCard.emitted('toggleSelection')).toBeTruthy();
      expect(mapCard.emitted('toggleSelection')).toEqual([
        [{ map, isSelected: true }]
      ]);
    });

    describe('should toggle favorite state', () => {
      it('should call like when map is not favorited', () => {
        const map = visualization.visualizations[0];
        const mapCard = shallowMount(MapCard, {
          store,
          localVue,
          propsData: { map },
          mocks: {
            $cartoModels,
            $t
          }
        });
        expect(mapCard.vm.$props.map.liked).toBe(false);

        mapCard.vm.toggleFavorite();

        expect(actions['maps/like']).toHaveBeenCalled();
      });

      it('should call deleteLike when map is favorited', () => {
        const map = visualization.visualizations[1];
        const mapCard = shallowMount(MapCard, {
          store,
          localVue,
          propsData: { map },
          mocks: {
            $cartoModels,
            $t
          }
        });
        expect(mapCard.vm.$props.map.liked).toBe(true);

        mapCard.vm.toggleFavorite();

        expect(actions['maps/deleteLike']).toHaveBeenCalled();
      });
    });

    it('should open quick actions', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);

      mapCard.vm.openQuickActions();

      expect(mapCard.vm.areQuickActionsOpen).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });

    it('should close quick actions', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);
      mapCard.vm.openQuickActions();
      expect(mapCard.vm.areQuickActionsOpen).toBe(true);

      mapCard.vm.closeQuickActions();

      expect(mapCard.vm.areQuickActionsOpen).toBe(false);
      expect(mapCard).toMatchSnapshot();
    });

    it('should toggle mouse hover', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
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

  describe('Events', () => {
    it('should receive and process correctly the event when dropdown is open', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);

      mapCard.find('.card-actions').vm.$emit('open');

      expect(mapCard.vm.areQuickActionsOpen).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });

    it('should receive and process correctly the event when dropdown is closed', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(MapCard, {
        propsData: { map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);

      mapCard.vm.openQuickActions();
      expect(mapCard.vm.areQuickActionsOpen).toBe(true);
      mapCard.find('.card-actions').vm.$emit('close');

      expect(mapCard.vm.areQuickActionsOpen).toBe(false);
      expect(mapCard).toMatchSnapshot();
    });
  });

  describe('Computed', () => {
    it('should return correct css class', () => {
      const map = { ...visualization.visualizations[0] };
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

    describe('tagsLength', () => {
      it('should return 0 tags', () => {
        const map = visualization.visualizations[0];
        const mapCard = shallowMount(MapCard, {
          propsData: { map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(mapCard.vm.tagsLength).toBe(0);
      });

      it('should return number of tags', () => {
        const map = { ...visualization.visualizations[0] };
        map.tags = ['one', 'two', 'three with a space', 'fourth with a comma'];
        const mapCard = shallowMount(MapCard, {
          propsData: { map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(mapCard.vm.tagsLength).toBe(4);
      });
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
