var _ = require('underscore');
var cdb = require('cartodb.js-v3');
var VendorScriptsView = require('../../../../javascripts/cartodb/common/vendor_scripts_view');

var CONFIG = {
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

var USER = {
  username: 'pepe',
  base_url: 'http://pepe.carto.com',
  email: 'pepe@carto.com',
  account_type: 'FREE',
  intercom: true
};

describe('common/vendor_scripts_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User(USER);
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    this.view = new VendorScriptsView({
      config: CONFIG,
      assetsVersion: '1.0.0',
      user: this.user
    });
  });

  it('should render given template with template data', function () {
    spyOn(this.view, 'template');

    this.view.render();

    expect(this.view.template).toHaveBeenCalledWith({
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
    });
  });

  it("should inject the rendered results into the view's element", function () {
    spyOn(this.view, 'template').and.returnValue('<div>foo bar!</div>');
    spyOn(this.view.$el, 'html');

    this.view.render();

    expect(this.view.$el.html).toHaveBeenCalledWith('<div>foo bar!</div>');
  });

  it('should not render hubspot script if it is not enabled', function () {
    var CONFIG_NO_VENDOR = _.extend(CONFIG, {
      hubspot_enabled: false,
      trackjs_enabled: false,
      google_analytics_ua: null
    });

    var USER_NO_VENDOR = _.extend(USER, {
      intercom: false
    });

    this.user = new cdb.admin.User(USER_NO_VENDOR);

    this.view = new VendorScriptsView({
      config: CONFIG_NO_VENDOR,
      assetsVersion: '1.0.0',
      user: this.user
    });

    spyOn(this.view, 'template');

    this.view.render();

    expect(this.view.template).toHaveBeenCalledWith({
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
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
