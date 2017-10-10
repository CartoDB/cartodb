var cdb = require('cartodb.js-v3');
var PublicMapInfoView = require('../../../../javascripts/cartodb/public_map/public_map_info_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');

describe('public_map/public_map_info_static', function () {
  beforeEach(function () {
    var currentUser = new cdb.admin.User(userdataJson.user_data);
    var data = userdataJson;
    var vizdata = vizdataJson;

    this.view = new PublicMapInfoView({
      currentUser: currentUser,
      data: data,
      vizdata: vizdata
    });

    this.view.render();
  });

  it('should render', function () {
    expect(this.view.el).toBeDefined();
  });

  afterEach(function () {
    this.view.clean();
    window.defaultFallbackBasemapTemplateUrl = undefined;
    delete window.defaultFallbackBasemapTemplateUrl;
  });
});
