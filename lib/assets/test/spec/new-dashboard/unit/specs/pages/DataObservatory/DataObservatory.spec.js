import { shallowMount } from '@vue/test-utils';
import DataObservatory from 'new-dashboard/pages/DataObservatory';

describe('DataObservatory.vue', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      const dataobservatoryPage = shallowMount(DataObservatory);
      expect(dataobservatoryPage).toMatchSnapshot();
    });
  });
});
