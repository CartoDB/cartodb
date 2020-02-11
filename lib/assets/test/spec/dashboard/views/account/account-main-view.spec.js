const $ = require('jquery');
const _ = require('underscore');
const CartoNode = require('carto-node');
const AccountMainView = require('dashboard/views/account/account-main-view');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/account/account-main-view', function () {
  const client = new CartoNode.AuthenticatedClient();
  let userModel, view;

  const createViewFn = function (options) {
    const $el = $('<div id="app"></div>');

    userModel = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    ConfigModelFixture.set('upgrade_url', 'upgradeUrl');

    const viewOptions = Object.assign({
      el: $el,
      assetsVersion: '1.0.0',
      configModel: ConfigModelFixture,
      userModel,
      client,
      organizationNotifications: {}
    }, options);

    const view = new AccountMainView(viewOptions);
    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(view._userModel).toBe(userModel);
    });
  });

  describe('._initViews', function () {
    it('should init views properly', function () {
      expect(_.size(view._subviews)).toBe(4);
    });

    it('should show the trial notification if the user\'s show_trial_reminder is true', function () {
      userModel = new UserModel({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'Free 2020',
        show_trial_reminder: true,
        id: 1,
        api_key: 'hello-apikey'
      });

      view = createViewFn({ userModel });

      expect(_.size(view._subviews)).toBe(5);
    });
  });

  afterEach(function () {
    view.clean();
  });
});
