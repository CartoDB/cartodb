const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const ProfileMainView = require('dashboard/views/profile/profile-main-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const UserModel = require('dashboard/data/user-model');

const ASSETS_VERSION = '4.1.0';

describe('dashboard/views/profile/profile-main-view', function () {
  let userModel, configModel, view, $el;

  const createViewFn = function (options) {
    $el = $('<div id="app"></div>');

    userModel = new UserModel(
      _.extend({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'FREE',
        id: 1,
        api_key: 'hello-apikey'
      }, options)
    );

    configModel = new Backbone.Model({
      avatar_valid_extensions: ['jpeg', 'jpg', 'gif', 'png'],
      account_update_url: 'https://carto.com'
    });

    configModel.prefixUrl = () => '/public/assets/';

    const view = new ProfileMainView({
      el: $el,
      userModel,
      configModel,
      modals: new ModalsServiceModel(),
      assetsVersion: ASSETS_VERSION
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(view._userModel).toBe(userModel);
      expect(view._configModel).toEqual(configModel);
    });
  });

  describe('._initViews', function () {
    it('should init views properly', function () {
      expect(_.size(view._subviews)).toBe(7);
    });

    it('should show the trial notification if the user\'s account is PERSONAL30', function () {
      view = createViewFn({
        account_type: 'PERSONAL30'
      });

      expect(_.size(view._subviews)).toBe(8);
    });
  });

  afterEach(function () {
    view.clean();
  });
});
