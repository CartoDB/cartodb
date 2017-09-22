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
  hubspot_ids: '{}',
  intercom_app_id: 'intercom_app_id'
};

describe('common/vendor_scripts_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'e00000002@d00000002.com',
      account_type: 'FREE'
    });
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
      trackjsCustomer: 'trackjs_customer',
      trackjsEnabled: true,
      trackjsAppKey: 'trackjs_app_key',
      assetsVersion: '1.0.0',
      userName: 'pepe',
      ua: 'UA-20934186-25',
      domain: 'carto.com',
      memberType: 'FREE',
      hubspotEnabled: true,
      hubspotToken: 'yourtoken',
      hubspotIds: '{}',
      intercomEnabled: true,
      intercomAppId: 'intercom_app_id',
      userEmail: 'e00000002@d00000002.com'
    });
  });

  it("should inject the rendered results into the view's element", function () {
    spyOn(this.view, 'template').and.returnValue('<div>foo bar!</div>');
    spyOn(this.view.$el, 'html');

    this.view.render();

    expect(this.view.$el.html).toHaveBeenCalledWith('<div>foo bar!</div>');
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
