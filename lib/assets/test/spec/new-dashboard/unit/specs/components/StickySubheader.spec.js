import { shallowMount } from '@vue/test-utils';
import StickySubheader from 'new-dashboard/components/StickySubheader';

describe('StickySubheader.vue', () => {
  it('should render correct contents', () => {
    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: false },
      slots: {
        default: '<div class="default-slot"></div>'
      }
    });
    expect(stickySubheader).toMatchSnapshot();
  });

  it('should have is-visible class when isVisible is true', () => {
    const stickySubheader = shallowMount(StickySubheader, { propsData: { isVisible: true } });
    expect(stickySubheader).toMatchSnapshot();
  });
});
