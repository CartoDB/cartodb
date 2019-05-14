import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import StickySubheader from 'new-dashboard/components/StickySubheader';

const localVue = createLocalVue();
localVue.use(Vuex);

function createStore (customStoreData) {
  const storeData = {
    user: {
      isNotificationVisible: false
    }
  };

  const storeInstance = new Vuex.Store({
    state: customStoreData || storeData
  });

  return storeInstance;
}
const store = createStore();

describe('StickySubheader.vue', () => {
  it('should render correct contents', () => {
    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: false },
      slots: {
        default: '<div class="default-slot"></div>'
      },
      store,
      localVue
    });
    expect(stickySubheader).toMatchSnapshot();
  });

  it('should have is-visible class when isVisible is true', () => {
    const stickySubheader = shallowMount(StickySubheader, {
      propsData: { isVisible: true },
      store,
      localVue
    });
    expect(stickySubheader).toMatchSnapshot();
  });
});
