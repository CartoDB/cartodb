import { shallowMount, createLocalVue } from '@vue/test-utils';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import SimpleMapCard from 'new-dashboard/components/MapCard/SimpleMapCard';
import usersArray from '../../fixtures/users';
import visualization from '../../fixtures/visualizations';
import Vuex from 'vuex';

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
    const mapCard = shallowMount(SimpleMapCard, {
      propsData: { visualization: map, isSelected: true },
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
    map.permission.acl = [{
      'type': 'user',
      'entity': {
        'id': '5e7bd9aa-51a7-4ceb-a9d0-fc67cc68a944',
        'username': 'cdb'
      },
      'access': 'r'
    }];
    const mapCard = shallowMount(SimpleMapCard, {
      propsData: { visualization: map },
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
    const mapCard = shallowMount(SimpleMapCard, {
      propsData: { visualization: map },
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
    const mapCard = shallowMount(SimpleMapCard, {
      propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
        const mapCard = shallowMount(SimpleMapCard, {
          store,
          localVue,
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(mapCard.vm.$props.visualization.liked).toBe(false);

        mapCard.vm.toggleFavorite();

        expect(actions['maps/like']).toHaveBeenCalled();
      });

      it('should call deleteLike when map is favorited', () => {
        const map = visualization.visualizations[1];
        const mapCard = shallowMount(SimpleMapCard, {
          store,
          localVue,
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });
        expect(mapCard.vm.$props.visualization.liked).toBe(true);

        mapCard.vm.toggleFavorite();

        expect(actions['maps/deleteLike']).toHaveBeenCalled();
      });
    });

    it('should open quick actions', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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

    it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      mapCard.vm.onContentChanged();

      expect(mapCard.emitted('contentChanged')).toBeTruthy();
    });
  });

  describe('Events', () => {
    it('should receive and process correctly the event when dropdown is open', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);

      mapCard.find(MapQuickActions).vm.$emit('open');

      expect(mapCard.vm.areQuickActionsOpen).toBe(true);
      expect(mapCard).toMatchSnapshot();
    });

    it('should receive and process correctly the event when dropdown is closed', () => {
      const map = visualization.visualizations[0];
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      expect(mapCard.vm.areQuickActionsOpen).toBe(false);

      mapCard.vm.openQuickActions();
      expect(mapCard.vm.areQuickActionsOpen).toBe(true);
      mapCard.find(MapQuickActions).vm.$emit('close');

      expect(mapCard.vm.areQuickActionsOpen).toBe(false);
      expect(mapCard).toMatchSnapshot();
    });
  });

  describe('Computed', () => {
    it('should return correct css class', () => {
      const map = { ...visualization.visualizations[0] };
      map.privacy = 'PRIVATE';
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });
      map.privacy = 'PUBLIC';
      const mapCard2 = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
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
        const mapCard = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
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
        const mapCard = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
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
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.vizUrl).toBe('http://example.com/viz/e97e0001-f1c2-425e-8c9b-0fb28da59200');
    });

    describe('showViews', () => {
      it('should return true if the map has public privacy', () => {
        const map = {...visualization.visualizations[0]};
        map.privacy = 'PUBLIC';
        const publicMap = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(publicMap.vm.showViews).toBe(true);
      });

      it('should return true if the map has link privacy', () => {
        const map = {...visualization.visualizations[0]};
        map.privacy = 'LINK';
        const publicMap = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(publicMap.vm.showViews).toBe(true);
      });

      it('should return true if the map has password privacy', () => {
        const map = {...visualization.visualizations[0]};
        map.privacy = 'PASSWORD';
        const publicMap = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(publicMap.vm.showViews).toBe(true);
      });

      it('should return false if the map has a privacy different than public/password/link', () => {
        const map = {...visualization.visualizations[0]};
        map.privacy = 'PRIVATE';
        const publicMap = shallowMount(SimpleMapCard, {
          propsData: { visualization: map },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(publicMap.vm.showViews).toBe(false);
      });
    });

    it('should return the total amount of views', () => {
      const map = {...visualization.visualizations[0]};
      map.stats = {'2018-10-17': 0, '2018-10-18': 3, '2018-10-19': 0, '2018-10-20': 0, '2018-10-21': 0, '2018-10-22': 0, '2018-10-23': 0, '2018-10-24': 0, '2018-10-25': 0, '2018-10-26': 0, '2018-10-27': 0, '2018-10-28': 0, '2018-10-29': 0, '2018-10-30': 0, '2018-10-31': 0, '2018-11-01': 0, '2018-11-02': 20, '2018-11-03': 0, '2018-11-04': 0, '2018-11-05': 0, '2018-11-06': 0, '2018-11-07': 0, '2018-11-08': 0, '2018-11-09': 0, '2018-11-10': 0, '2018-11-11': 0, '2018-11-12': 100, '2018-11-13': 0, '2018-11-14': 0, '2018-11-15': 1};
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.numberViews).toBe(124);
    });
    it('should return the correct amount of tag chars', () => {
      const map = {...visualization.visualizations[0]};
      map.tags = ['abc', 'bcd', '', 'with space'];
      const mapCard = shallowMount(SimpleMapCard, {
        propsData: { visualization: map },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(mapCard.vm.tagsChars).toBe(22);
    });
  });

  describe('properties', () => {
    let map, mocks;
    beforeEach(() => {
      map = {...visualization.visualizations[0]};
      mocks = { $cartoModels, $t };
    });

    it('should select the map when the user clicks on the card and selectMode property is true', () => {
      const mapCardWrapper = shallowMount(SimpleMapCard, {
        propsData: { selectMode: true, visualization: map },
        mocks
      });

      mapCardWrapper.trigger('click');

      expect(mapCardWrapper.emitted().toggleSelection).toBeDefined();
    });

    it('should not the map when the user clicks on the card and selectMode property is true', () => {
      const mapCardWrapper = shallowMount(SimpleMapCard, {
        propsData: { selectMode: false, visualization: map },
        mocks
      });

      mapCardWrapper.trigger('click');

      expect(mapCardWrapper.emitted().toggleSelection).toBeUndefined();
    });
  });
});
