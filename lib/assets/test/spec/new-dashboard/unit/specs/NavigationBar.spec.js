import { shallow } from '@vue/test-utils';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

describe('NavigationBar.vue', () => {
  it('should render correct contents', () => {
    const navigationBar = shallow(NavigationBar);
    expect(navigationBar).toMatchSnapshot();
  });
});
