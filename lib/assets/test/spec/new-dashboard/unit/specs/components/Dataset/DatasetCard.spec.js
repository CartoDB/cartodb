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

let $cartoModels;
const $t = key => key;

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}

describe('DatasetCard.vue', () => {
  beforeEach(() => {
    $cartoModels = configCartoModels();
  });

  it('should render correct contents', () => {
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t
      }
    });

    expect(datasetCard).toMatchSnapshot();
  });

  it('should be able to select the card', () => {
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t
      }
    });
    const checkbox = datasetCard.find('.checkbox-input');

    checkbox.trigger('click');

    expect(datasetCard).toMatchSnapshot();
  });

  it('should show the map is shared', () => {
    $cartoModels = configCartoModels({ user: usersArray[1] });
    const dataset = datasets.visualizations[0];
    const datasetCard = shallowMount(DatasetCard, {
      propsData: { dataset },
      mocks: {
        $cartoModels,
        $t
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
        $t
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
          $t
        }
      });

      const iconClass = datasetCard.vm.privacyIcon;

      expect(iconClass).toBe('icon--public');
    });

    describe('numberRows', () => {
      it('If there are zero rows, should print the plural of "row"', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.row_count = 0;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(datasetCard.vm.numberRows).toBe('DatasetCard.numberRows');
      });

      it('If there is only one row, should print the singular of "row"', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.row_count = 1;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(datasetCard.vm.numberRows).toBe('DatasetCard.numberRow');
      });

      it('If there are multiple rows, should print the plural of "row"', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.table.row_count = 2;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(datasetCard.vm.numberRows).toBe('DatasetCard.numberRows');
      });
    });

    it('It should return the correct dataType"', () => {
      const dataset = {...datasets.visualizations[0]};
      dataset.table.geometry_types = ['ST_Multipolygon', 'ST_Point'];
      const datasetCard = shallowMount(DatasetCard, {
        propsData: { dataset },
        mocks: {
          $cartoModels,
          $t
        }
      });

      expect(datasetCard.vm.dataType).toBe('multipolygon');
    });

    describe('numberTags', () => {
      it('Should return 0 when the tags are null', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = null;
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(datasetCard.vm.numberTags).toBe(0);
      });

      it('Should return the number of thags when we have tags', () => {
        const dataset = {...datasets.visualizations[0]};
        dataset.tags = ['test 1', 'Another test'];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
          }
        });

        expect(datasetCard.vm.numberTags).toBe(2);
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
            $t
          }
        });

        expect(datasetCard.vm.isShared).toBe(true);
      });

      it('Should return false if the user is different than the owner of the map', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
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
            $t
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
            $t
          }
        });

        expect(datasetCard.vm.humanFileSize(0)).toBe('0 B');
        expect(datasetCard.vm.humanFileSize(1)).toBe('1 B');
        expect(datasetCard.vm.humanFileSize(1024)).toBe('1 kB');
        expect(datasetCard.vm.humanFileSize((Math.pow(1024, 2) * 4) + (Math.pow(1024, 2) / 3))).toBe('4.33 MB');
        expect(datasetCard.vm.humanFileSize(Math.pow(1024, 3))).toBe('1 GB');
      });

      it('should put the active hover to true', () => {
        const dataset = datasets.visualizations[0];
        const datasetCard = shallowMount(DatasetCard, {
          propsData: { dataset },
          mocks: {
            $cartoModels,
            $t
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
            $t
          }
        });

        datasetCard.vm.mouseOutChildElement();

        expect(datasetCard.vm.activeHover).toBe(true);
      });
    });
  });
});
