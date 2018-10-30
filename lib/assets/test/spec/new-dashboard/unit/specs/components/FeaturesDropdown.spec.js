import { shallowMount } from '@vue/test-utils';
import FeaturesDropdown from 'new-dashboard/components/FeaturesDropdown';

describe('FeaturesDropdown.vue', () => {
  it('should render correct contents', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        tags: ['one tag test'],
        feature: 'tag'
      }
    });
    expect(featuresDropdown).toMatchSnapshot();
  });

  it('should render correct multiple elements', () => {
    const featuresDropdown = shallowMount(FeaturesDropdown, {
      propsData: {
        tags: ['my first map', 'another map', 'Madrid visualization', 'NoSpacesMap'],
        feature: 'maps'
      }
    });
    expect(featuresDropdown).toMatchSnapshot();
  });
});
