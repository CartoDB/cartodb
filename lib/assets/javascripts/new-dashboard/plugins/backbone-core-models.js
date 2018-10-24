import Vue from 'vue';
import ConfigModel from 'dashboard/data/config-model';
import UserModel from 'dashboard/data/user-model';

const BackboneCoreModels = {};

BackboneCoreModels.install = function (Vue, options) {
  Vue.mixin({
    beforeCreate () {
      this.$cartoModels = options;
    }
  });
};

Vue.use(BackboneCoreModels, {
  config: new ConfigModel(window.CartoConfig.data.config),
  user: new UserModel(window.CartoConfig.data.user_data)
});
