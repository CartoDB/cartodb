const _ = require('underscore');
const VendorScriptsView = require('dashboard/components/vendor-scripts/vendor-scripts-view');
const template = require('dashboard/components/vendor-scripts/vendor-scripts.tpl');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');

const configModelData = {
  trackjs_customer: 'trackjs_customer',
  trackjs_enabled: true,
  trackjs_app_key: 'trackjs_app_key',
  google_analytics_ua: 'UA-20934186-25',
  google_analytics_domain: 'carto.com',
  hubspot_enabled: true,
  hubspot_token: 'yourtoken',
  fullstoryEnabled: false,
  fullstoryOrg: '',
  hubspot_ids: '{}',
  intercom_app_id: 'intercom_app_id'
};

const userModelData = {
  username: 'pepe',
  base_url: 'http://pepe.carto.com',
  email: 'pepe@carto.com',
  account_type: 'FREE',
  intercom: true
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
      googleAnalyticsDomain: 'carto.com',
      googleAnalyticsMemberType: 'FREE',
      googleAnalyticsUa: 'UA-20934186-25',
      hubspotEnabled: true,
      hubspotIds: '{}',
      hubspotToken: 'yourtoken',
      intercomAppId: 'intercom_app_id',
      intercomEnabled: true,
      trackjsAppKey: 'trackjs_app_key',
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: true,
      fullstoryEnabled: false,
      fullstoryOrg: '',
      userEmail: 'pepe@carto.com',
      userName: 'pepe'
    }));
  });

  it("should inject the rendered results into the view's element", function () {
    view.render();

    expect(view.$el.html).toHaveBeenCalledWith(template({
      assetsVersion: '1.0.0',
      googleAnalyticsDomain: 'carto.com',
      googleAnalyticsMemberType: 'FREE',
      googleAnalyticsUa: 'UA-20934186-25',
      hubspotEnabled: true,
      hubspotIds: '{}',
      hubspotToken: 'yourtoken',
      intercomAppId: 'intercom_app_id',
      intercomEnabled: true,
      trackjsAppKey: 'trackjs_app_key',
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: true,
      fullstoryEnabled: false,
      fullstoryOrg: '',
      userEmail: 'pepe@carto.com',
      userName: 'pepe'
    }));
  });

  it('should not render hubspot script if it is not enabled', function () {
    const configNoVendor = _.extend(configModelData, {
      hubspot_enabled: false,
      trackjs_enabled: false,
      google_analytics_ua: null
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

    expect(view.$el.html).toHaveBeenCalledWith(template({
      assetsVersion: '1.0.0',
      googleAnalyticsDomain: 'carto.com',
      googleAnalyticsMemberType: 'FREE',
      googleAnalyticsUa: null,
      hubspotEnabled: false,
      hubspotIds: '{}',
      hubspotToken: 'yourtoken',
      intercomAppId: 'intercom_app_id',
      intercomEnabled: false,
      trackjsAppKey: 'trackjs_app_key',
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: false,
      fullstoryEnabled: false,
      fullstoryOrg: '',
      userEmail: 'pepe@carto.com',
      userName: 'pepe'
    }));
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
