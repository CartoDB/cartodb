import { shallowMount } from '@vue/test-utils';
import DataObservatoryCard from 'new-dashboard/components/Dataset/DataObservatoryCard';

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

const $t = key => key;

describe('DataObservatoryCard.vue', () => {
  it('should render correct contents', () => {
    const dataObservatoryCard = shallowMount(DataObservatoryCard, {
      mocks: {
        $t
      },
      propsData: {
        dataset: dataObservatorySample[0]
      }
    });

    expect(dataObservatoryCard).toMatchSnapshot();
  });

  it('Should open the card', () => {
    const dataObservatoryCard = shallowMount(DataObservatoryCard, {
      mocks: {
        $t
      },
      propsData: {
        dataset: dataObservatorySample[0]
      }
    });

    expect(dataObservatoryCard.vm.isOpen).toBe(false);
    const card = dataObservatoryCard.find('.dataobservatory-card');
    card.trigger('click');

    expect(dataObservatoryCard).toMatchSnapshot();
    expect(dataObservatoryCard.vm.isOpen).toBe(true);

    card.trigger('click');
    expect(dataObservatoryCard.vm.isOpen).toBe(false);
  });

  describe('Computed', () => {
    it('Should return the correct text for the button', () => {
      const dataObservatoryCard = shallowMount(DataObservatoryCard, {
        mocks: {
          $t
        },
        propsData: {
          dataset: dataObservatorySample[0]
        }
      });

      expect(dataObservatoryCard.vm.buttonText).toBe('dataObservatory.viewMore');

      const card = dataObservatoryCard.find('.dataobservatory-card');
      card.trigger('click');

      expect(dataObservatoryCard.vm.buttonText).toBe('dataObservatory.close');
    });
  });
});
