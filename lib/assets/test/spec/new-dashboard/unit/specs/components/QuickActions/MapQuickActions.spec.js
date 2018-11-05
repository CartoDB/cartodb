import { shallowMount } from '@vue/test-utils';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import visualization from '../fixtures/visualizations';

const map = visualization.visualizations[0];

describe('MapQuickAction.vue', () => {
  it('should render correct contents', () => {
    const mapQuickAction = shallowMount(MapQuickActions, {
      propsData: { map }
    });

    expect(mapQuickAction).toMatchSnapshot();
  });

  describe('methods', () => {
    it('should open edit metadata modal', () => {
      const mapQuickAction = shallowMount(MapQuickActions, {
        propsData: { map }
      });

      mapQuickAction.vm.selectAll();

      expect(mapQuickAction).toMatchSnapshot();
    });
  });
});
