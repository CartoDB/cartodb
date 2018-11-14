import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import datasets from '../../fixtures/datasets';
import usersArray from '../../fixtures/users';
import DatasetCard from 'new-dashboard/components/Dataset/DatasetCard';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const localVue = createLocalVue();
localVue.use(Vuex);

let $cartoModels, actions, store;
const $t = key => key;
const $tc = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

describe('DatasetCard.vue', () => {
  beforeEach(() => {
    $cartoModels = configCartoModels();

    actions = {
      'datasets/deleteLike': jest.fn(),
      'datasets/like': jest.fn()
    };

    store = new Vuex.Store({
      actions
    });
  });

  it('should render correct contents', () => {
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });

    expect(datasetCard).toMatchSnapshot();
  });

  it('should select the card when the checkbox is clicked', () => {
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });
    const checkbox = datasetCard.find('.checkbox-input');

    checkbox.trigger('click');

    expect(datasetCard).toMatchSnapshot();
  });

  it('should show the owner of the map if it is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });

    expect(datasetCard).toMatchSnapshot();
  });

  it('should render tags', () => {
    const dataset = {...datasets.visualizations[0]};
    dataset.tags = ['Hi', 'Hello', 'CARTO Rules'];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });

    expect(datasetCard).toMatchSnapshot();
  });

  it('should render multiple tags', () => {
    const dataset = {...datasets.visualizations[0]};
    dataset.tags = ['Hi', 'Hello', 'CARTO Rules', 'Just one more tag here'];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });

    expect(datasetCard).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should generate the correct icon class', () => {
      const dataset = {...datasets.visualizations[0]};
      dataset.privacy = 'PUBLIC';
      const datasetCard = shallowMount(DatasetCard, {
        propsData: { dataset },
        mocks: {
          $cartoModels,
          $t,
          $tc
        }
      });

      const iconClass = datasetCard.vm.privacyIcon;

      expect(iconClass).toBe('icon--public');
    });

    describe('lastUpdated', () => {
      it('should return lastUpdated string when it is not synchronized', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.synchronization = null;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.lastUpdated).toBe('DatasetCard.lastUpdated');
      });

      it('should return lastSynced string when it is synchronized', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.synchronization = {
          'updated_at': '2018-11-07T14:37:42.288Z'
        };
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.lastUpdated).toBe('DatasetCard.lastSynced');
      });
    });

    describe('dataType', () => {
      it('should return the data type of the first geometry type when there are many', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.geometry_types = ['ST_Multipolygon', 'ST_Point'];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.dataType).toBe('polygon');
      });

      it('should return the correct dataType', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.geometry_types = ['ST_LineString'];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.dataType).toBe('line');
      });

      it('should return "empty" when there is no dataType', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.geometry_types = [];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.dataType).toBe('unknown');
      });
    });

    describe('numberTags', () => {
      it('Should return 0 when the tags are null', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = null;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.numberTags).toBe(0);
      });

      it('Should return the number of tags when we have tags', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = ['test 1', 'Another test'];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.numberTags).toBe(2);
      });
    });

    describe('tagsChars', () => {
      it('should return the number of characters in the tags', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = ['abcd', 'e', 'fghi']; // [4, 1, 4] + 2 * 2 characters of the ", "
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.tagsChars).toBe(13);
      });

      it('should return the 0 if there are no tags', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = null;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.tagsChars).toBe(0);
      });
    });

    describe('isShared', () => {
      it('Should return true if the user is different than the owner of the map', () => {
        $cartoModels = configCartoModels({ user: usersArray[1] });
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.isShared).toBe(true);
      });

      it('Should return false if the user is the same than the owner of the map', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.isShared).toBe(false);
      });
    });

    describe('methods', () => {
      it('should toggle selection', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });
        expect(datasetCard.vm.selected).toBe(false);

        datasetCard.vm.toggleSelection();
        expect(datasetCard.vm.selected).toBe(true);

        datasetCard.vm.toggleSelection();
        expect(datasetCard.vm.selected).toBe(false);
      });

      it('should return human readable file size', () => {
        const dataset = {...datasets.visualizations[0]};
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.humanFileSize(0)).toBe('0 B');
        expect(datasetCard.vm.humanFileSize(1)).toBe('1 B');
        expect(datasetCard.vm.humanFileSize(1024)).toBe('1 kB');
        expect(datasetCard.vm.humanFileSize((Math.pow(1024, 2) * 4) + (Math.pow(1024, 2) / 3))).toBe('4.33 MB');
        expect(datasetCard.vm.humanFileSize(Math.pow(1024, 3))).toBe('1 GB');
      });

      describe('should toggle favorite state', () => {
        it('should call like when dataset is not favorited', () => {
          const dataset = {...datasets.visualizations[0]};
          dataset.liked = false;
          const datasetCard = shallowMount(DatasetCard, {
            propsData: { dataset },
            store,
            localVue,
            mocks: {
              $cartoModels,
              $t,
              $tc
            }
          });
          expect(datasetCard.vm.$props.dataset.liked).toBe(false);

          datasetCard.vm.toggleFavorite();

          expect(actions['datasets/like']).toHaveBeenCalled();
        });

        it('should call deleteLike when dataset is favorited', () => {
          const dataset = {...datasets.visualizations[0]};
          dataset.liked = true;
          const datasetCard = shallowMount(DatasetCard, {
            propsData: { dataset },
            store,
            localVue,
            mocks: {
              $cartoModels,
              $t,
              $tc
            }
          });
          expect(datasetCard.vm.$props.dataset.liked).toBe(true);

          datasetCard.vm.toggleFavorite();

          expect(actions['datasets/deleteLike']).toHaveBeenCalled();
        });
      });

      it('should put the active hover to true', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        datasetCard.vm.mouseOverChildElement();

        expect(datasetCard.vm.activeHover).toBe(false);
      });

      it('should put the active hover to false', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        datasetCard.vm.mouseOutChildElement();

        expect(datasetCard.vm.activeHover).toBe(true);
      });
    });
  });
});
