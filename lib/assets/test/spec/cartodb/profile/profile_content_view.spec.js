var cdb = require('cartodb.js-v3');
var ProfileContentView = require('../../../../javascripts/cartodb/profile/profile_content_view');
var FlashMessageModel = require('../../../../javascripts/cartodb/organization/flash_message_model');

describe('profile/profile_content_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'e00000002@d00000002.com',
      account_type: 'FREE'
    });
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    var flashMessageModel = new FlashMessageModel();

    this.view = new ProfileContentView({
      user: this.user,
      flashMessageModel: flashMessageModel
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
