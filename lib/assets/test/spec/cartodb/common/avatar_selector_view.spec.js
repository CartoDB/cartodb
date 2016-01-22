var cdbAdmin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var AvatarSelector = require('../../../../javascripts/cartodb/common/avatar_selector_view');
var AssetModel = require('../../../../javascripts/cartodb/common/asset_model.js')


describe('common/avatar_selector_view', function() {
  beforeEach(function() {
    this.view = new AvatarSelector({
      renderModel: new cdb.core.Model({
        inputName: 'user[avatar_url]',
        name: "test",
        avatar_url: "avatar-url",
        id: "uuuu-uuuu"
      })
    });

    this.view.render();
  });

  it('should render properly', function() {
    expect(this.view.$('.FormAccount-avatarPreviewImage').length).toBe(1);
    expect(this.view.$('.js-fileAvatar').length).toBe(1);
  });

  it('should disable input and show loader when file is chosen', function() {
    AssetModel.prototype.save = function(a, b, opts) {};
    this.view.$(":file").trigger('change');
    expect(this.view.model.get('state')).toBe('loading');
    expect(this.view.$('.btn[disabled]').length).toBe(1);
  });

  it('should enable input and remove loader when upload fails', function(done) {
    var self = this;

    AssetModel.prototype.save = function(a, b, opts) {
      setTimeout(function() {
        b.error()
      },1);
    };

    this.view.$(":file").trigger('change');

    setTimeout(function() {
      expect(self.view.model.get('state')).toBe('error');
      expect(self.view.$('.btn[disabled]').length).toBe(0);
      expect(self.view.$('.FormAccount-rowInfoText--error').length).toBe(1);
      done();
    },100);
  });

  it('should enable input and remove loader when upload is completed', function(done) {
    var self = this;

    AssetModel.prototype.save = function(a, b, opts) {
      setTimeout(function() {
        b.success(a, { public_url: 'hello' });
      },1);
    };

    this.view.$(":file").trigger('change');

    setTimeout(function() {
      expect(self.view.model.get('state')).toBe('success');
      expect(self.view.$('.FormAccount-rowInfoText--error').length).toBe(0);
      expect(self.view.$('img').attr('src')).toBe('hello');
      expect(self.view.$('.btn[disabled]').length).toBe(0);
      done();
    },100);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
