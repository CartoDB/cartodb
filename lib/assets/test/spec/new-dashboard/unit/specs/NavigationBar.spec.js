import { shallowMount, createLocalVue } from '@vue/test-utils';
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

// Vue imports
import VueRouter from 'vue-router';
import Vuex from 'vuex';

// Backbone Models
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);

let store, user, config;

describe('NavigationBar.vue', () => {
  beforeEach(() => {
    user = {
      avatar_url: '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_yellow.png'
    };

    user.userModel = new UserModel(user);

    config = {};
    config.configModel = new ConfigModel(config);

    store = new Vuex.Store({
      state: {
        user,
        config
      }
    });
  });

  it('should render correct contents', () => {
    const navigationBar = shallowMount(NavigationBar, {
      propsData: { user },
      localVue,
      store
    });
    expect(navigationBar).toMatchSnapshot();
  });
});
