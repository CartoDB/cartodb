const _ = require('underscore');
const VendorScriptsView = require('dashboard/components/vendor-scripts/vendor-scripts-view');
const template = require('dashboard/components/vendor-scripts/vendor-scripts.tpl');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');

const configModelData = {
  trackjs_customer: 'trackjs_customer',
  trackjs_enabled: true,
  trackjs_app_key: 'trackjs_app_key',
  hubspot_token: 'yourtoken',
  fullstoryEnabled: false,
  fullstoryOrg: '',
  hubspot_ids: '{}',
  intercom_app_id: 'intercom_app_id',
  google_tag_manager_id: 'google_tag_manager_id'
};

const userModelData = {
  id: 'user-id',
  username: 'pepe',
  created_at: '2018-06-08T00:00:00.000Z',
  base_url: 'http://pepe.carto.com',
  email: 'pepe@carto.com',
  account_type: 'FREE',
  intercom: true,
  job_role: 'Developer',
  show_trial_reminder: false
};

describe('dashboard/components/vendor-scripts/vendor-scripts-view', function () {
  let userModel, view;

  const createViewFn = function (options) {
    userModel = new UserModel(userModelData);

    spyOn(userModel, 'featureEnabled').and.returnValue(true);

    const viewOptions = Object.assign({
      configModel: new ConfigModel(configModelData),
      assetsVersion: '1.0.0',
      userModel
    }, options);

    view = new VendorScriptsView(viewOptions);
    spyOn(view.$el, 'html');

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  it('should render given template with template data', function () {
    view.render();

    expect(view.$el.html).toHaveBeenCalledWith(template({
      assetsVersion: '1.0.0',
      hubspotEnabled: false,
      hubspotIds: '{}',
      hubspotToken: 'yourtoken',
      intercomAppId: 'intercom_app_id',
      intercomEnabled: true,
      trackjsAppKey: 'trackjs_app_key',
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: true,
      fullstoryEnabled: false,
      fullstoryOrg: '',
      userId: 'user-id',
      userAccountType: 'FREE',
      userCreatedAtInSeconds: 1528416000,
      userEmail: 'pepe@carto.com',
      userName: 'pepe',
      googleTagManagerId: 'google_tag_manager_id',
      userJobRole: 'Developer',
      userInTrialPeriod: false
    }));
  });

  it("should inject the rendered results into the view's element", function () {
    view.render();

    expect(view.$el.html).toHaveBeenCalledWith(template({
      assetsVersion: '1.0.0',
      hubspotEnabled: false,
      hubspotIds: '{}',
      hubspotToken: 'yourtoken',
      intercomAppId: 'intercom_app_id',
      intercomEnabled: true,
      trackjsAppKey: 'trackjs_app_key',
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: true,
      fullstoryEnabled: false,
      fullstoryOrg: '',
      userId: 'user-id',
      userAccountType: 'FREE',
      userCreatedAtInSeconds: 1528416000,
      userEmail: 'pepe@carto.com',
      userName: 'pepe',
      googleTagManagerId: 'google_tag_manager_id',
      userJobRole: 'Developer',
      userInTrialPeriod: false
    }));
  });

  it('should not render Google Tag Manager script if its id is not present', function () {
    const configNoVendor = _.extend(configModelData, {
      trackjs_enabled: false,
      google_tag_manager_id: null
    });

    const userModelNoVendor = _.extend(userModelData, {
      intercom: false
    });

    userModel = new UserModel(userModelNoVendor);

    view = createViewFn({
      configModel: new ConfigModel(configNoVendor),
      assetsVersion: '1.0.0',
      userModel
    });
    view.render();

    expect(view.$el.html).not.toContain('https://www.googletagmanager.com/gtm.js');
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
