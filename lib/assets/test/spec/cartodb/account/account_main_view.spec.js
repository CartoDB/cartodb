var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var AccountMainView = require('../../../../javascripts/cartodb/account/account_main_view');

describe('account/account_main_view', function () {
  beforeEach(function () {
    this.$el = $('<div id="app"></div>');

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    this.view = new AccountMainView({
      el: this.$el,
      user: this.user,
      config: {}
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view._userModel).toBe(this.user);
    });
  });

  describe('._initViews', function () {
    it('should init views properly', function () {
      expect(_.size(this.view._subviews)).toBe(7);
    });

    it('should show the trial notification if the user\'s account is PERSONAL30', function () {
      this.user = new cdb.admin.User({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'PERSONAL30',
        id: 1,
        api_key: 'hello-apikey'
      });

      this.view = new AccountMainView({
        el: this.$el,
        user: this.user,
        config: {}
      });

      expect(_.size(this.view._subviews)).toBe(8);
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
