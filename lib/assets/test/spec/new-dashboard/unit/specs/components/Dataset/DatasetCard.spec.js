import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import datasets from '../../fixtures/datasets';
import datasetsWithDependentVisualizations from '../../fixtures/datasetsWithDependentVisualizations';
import usersArray from '../../fixtures/users';
import { cloneObject } from '../../../utils/cloneObject';
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
      'datasets/like': jest.fn(),
      'search/deleteLike': jest.fn(),
      'search/like': jest.fn()
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

  it('should add class selected to the card when the property isSelected is true', () => {
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: {
        dataset,
        isSelected: true
      },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });
    expect(datasetCard).toMatchSnapshot();
  });

  it('should add the name of the owner if the dataset is shared', () => {
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

  it('should render maps in usage dropdown', () => {
    const dataset = {...datasets.visualizations[0]};
    dataset.dependent_visualizations_count = 1;
    dataset.dependent_visualizations = datasetsWithDependentVisualizations.visualizations;
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

  it('should render shared brief with all organisation members', () => {
    const dataset = {...datasets.visualizations[0]};
    const clonedDataset = cloneObject(dataset);
    clonedDataset.permission.acl = [{
      'type': 'org',
      'entity': {
        'id': 'xxxxx',
        'name': 'test-org',
        'avatar_url': null
      },
      'access': 'r'
    }];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset: clonedDataset },
      mocks: {
        $cartoModels,
        $t,
        $tc
      }
    });
    expect(datasetCard).toMatchSnapshot();
  });

  describe('Computed', () => {
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

        expect(datasetCard.vm.dataType).toBe('empty');
      });

      it('should return "unknown" when we dont recognize the data type', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.geometry_types = ['ST_myCustomDataType'];
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

    describe('isSharedWithMe', () => {
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

        expect(datasetCard.vm.isSharedWithMe).toBe(true);
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

        expect(datasetCard.vm.isSharedWithMe).toBe(false);
      });
    });

    describe('dependentVisualizationsWithUrl', () => {
      it('should return same visualizations with URL included', () => {
        $cartoModels = configCartoModels({ user: usersArray[1] });
        const dataset = datasetsWithDependentVisualizations.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t,
            $tc
          }
        });

        expect(datasetCard.vm.dependentVisualizationsWithUrl[0].url).toBe('http://example.com/viz/8a006cf8-1df7-49c7-b3e0-f7594f5798b6');
      });
    });
  });

  describe('Methods', () => {
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
      expect(datasetCard.vm.isSelected).toBe(false);
      datasetCard.vm.toggleSelection();

      expect(datasetCard.emitted('toggleSelection').length).toBe(1);
      expect(datasetCard.emitted('toggleSelection')[0]).toMatchObject([{
        dataset,
        isSelected: true}]);
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

    it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
      const dataset = datasets.visualizations[0];
      const datasetCard = shallowMount(DatasetCard, {
        propsData: { dataset },
        mocks: {
          $cartoModels,
          $t,
          $tc
        }
      });

      datasetCard.vm.onContentChanged();

      expect(datasetCard.emitted('contentChanged')).toBeTruthy();
    });

    it('should show copy name dropdown', () => {
      const dataset = datasets.visualizations[0];
      const datasetCard = shallowMount(DatasetCard, {
        propsData: { dataset },
        mocks: {
          $cartoModels,
          $t,
          $tc
        }
      });

      datasetCard.vm.showCopyDropdown();

      expect(datasetCard.vm.copyDropdownVisible).toBe(true);
      expect(datasetCard).toMatchSnapshot();
    });

    it('should hide the dropdown', () => {
      const dataset = datasets.visualizations[0];
      const datasetCard = shallowMount(DatasetCard, {
        propsData: { dataset },
        mocks: {
          $cartoModels,
          $t,
          $tc
        }
      });

      datasetCard.vm.showCopyDropdown();
      datasetCard.vm.hideCopyDropdown();

      expect(datasetCard.vm.copyDropdownVisible).toBe(false);
      expect(datasetCard).toMatchSnapshot();
    });
  });

  describe('properties', () => {
    let dataset, mocks;

    beforeEach(() => {
      dataset = {...datasets.visualizations[0]};
      mocks = { $cartoModels, $t, $tc };
    });

    it('should select the map when the user clicks on the card and selectMode property is true', () => {
      const datasetCardWrapper = shallowMount(DatasetCard, {
        propsData: { dataset, selectMode: true },
        mocks
      });

      datasetCardWrapper.trigger('click');

      expect(datasetCardWrapper.emitted().toggleSelection).toBeDefined();
    });

    it('should not the map when the user clicks on the card and selectMode property is true', () => {
      const datasetCardWrapper = shallowMount(DatasetCard, {
        propsData: { dataset, selectMode: false },
        mocks
      });

      datasetCardWrapper.trigger('click');

      expect(datasetCardWrapper.emitted().toggleSelection).toBeUndefined();
    });
  });
});
