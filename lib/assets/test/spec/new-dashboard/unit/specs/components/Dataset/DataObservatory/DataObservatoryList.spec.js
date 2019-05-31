import { shallowMount } from '@vue/test-utils';
import DataObservatoryList from 'new-dashboard/components/DataObservatoryList';

const dataObservatorySample = [
  {
    'title': 'Data 1',
    'category': 'Category 1',
    'description': 'This is a description test',
    'geographies': ['Country 1'],
    'companies': ['Company 1']
  },
  {
    'title': 'Data 2',
    'category': 'Category 2',
    'description': 'This is another description test',
    'geographies': ['Country 1', 'Country 2'],
    'companies': ['Company 2', 'Company 3']
  },
  {
    'title': 'Test 3',
    'category': 'Category 2',
    'description': 'This is another description test',
    'geographies': ['Country 4', 'Country 2'],
    'companies': ['Company 1', 'Company 3']
  }
];

const $t = (key) => {
  return key === 'dataObservatory.datasets' ? dataObservatorySample : key;
};

describe('DataObservatoryList.vue', () => {
  it('should render correct contents', () => {
    const dataObservatoryList = shallowMount(DataObservatoryList, {
      mocks: {
        $t
      }
    });

    expect(dataObservatoryList).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('Should calculate correctly the categories available', () => {
      const dataObservatoryList = shallowMount(DataObservatoryList, {
        mocks: {
          $t
        }
      });

      expect(dataObservatoryList.vm.categories).toContain('Category 1');
      expect(dataObservatoryList.vm.categories).toContain('Category 2');
      expect(dataObservatoryList.vm.categories).toHaveLength(2);
    });

    it('Should calculate correctly the countries available', () => {
      const dataObservatoryList = shallowMount(DataObservatoryList, {
        mocks: {
          $t
        }
      });

      expect(dataObservatoryList.vm.countries).toContain('Country 1');
      expect(dataObservatoryList.vm.countries).toContain('Country 2');
      expect(dataObservatoryList.vm.countries).toHaveLength(3);
    });

    it('Should return unfiltered datasets as no filter was set', () => {
      const dataObservatoryList = shallowMount(DataObservatoryList, {
        mocks: {
          $t
        }
      });

      expect(dataObservatoryList.vm.filteredDatasets).toEqual(dataObservatorySample);
    });

    it('Should return filtered datasets when a filter was set', () => {
      const dataObservatoryList = shallowMount(DataObservatoryList, {
        mocks: {
          $t
        }
      });

      dataObservatoryList.setData({textFilter: 'Data 1'});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[0]]);

      dataObservatoryList.setData({textFilter: 'data 2'});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[1]]);

      dataObservatoryList.setData({textFilter: 'Data'});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[0], dataObservatorySample[1]]);

      dataObservatoryList.setData({textFilter: 'weirdWord'});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([]);

      dataObservatoryList.setData({textFilter: '',
        geographyFilter: ['Country 1']});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[0], dataObservatorySample[1]]);

      dataObservatoryList.setData({geographyFilter: ['Country 2']});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[1], dataObservatorySample[2]]);

      dataObservatoryList.setData({geographyFilter: [],
        datatypeFilter: ['Category 2']});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([dataObservatorySample[1], dataObservatorySample[2]]);

      dataObservatoryList.setData({geographyFilter: ['Country 2'],
        datatypeFilter: ['Category 1']});
      expect(dataObservatoryList.vm.filteredDatasets).toEqual([]);
    });
  });
});
