import { shallowMount } from '@vue/test-utils';
import FeaturesDropdown from 'new-dashboard/components/Dropdowns/FeaturesDropdown';

describe('FeaturesDropdown.vue', () => {
  it('should render correct contents', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        list: ['one tag test'],
        feature: 'tag'
      },
      slots: {
        default: 'Default text'
      }
    });
    expect(featuresDropdown).toMatchSnapshot();
  });

  it('should render correct multiple elements', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        list: ['my first map', 'another map', 'Madrid visualization', 'NoSpacesMap'],
        feature: 'maps'
      },
      slots: {
        default: 'Default text'
      }
    });
    expect(featuresDropdown).toMatchSnapshot();
  });

  it('should render elements with url if present', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        list: [
          { name: 'Name 1', url: 'https://carto.com' },
          { name: 'Name 2', url: 'https://carto.com' }
        ]
      },
      slots: {
        default: 'Default text'
      }
    });

    expect(featuresDropdown).toMatchSnapshot();
  });

  it('should render footer if slot is present', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        list: ['my first map', 'another map', 'Madrid visualization', 'NoSpacesMap'],
        feature: 'maps'
      },
      slots: {
        default: 'Default text',
        footer: '+ 10 more'
      }
    });
    expect(featuresDropdown).toMatchSnapshot();
  });
});
