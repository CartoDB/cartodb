var ServiceItem = require('../../../../javascripts/cartodb/account/service_item_view');
var ServiceOauth = require('../../../../javascripts/cartodb/common/service_models/service_oauth_model');
var ServiceValidToken = require('../../../../javascripts/cartodb/common/service_models/service_valid_token_model');

describe('account/service_item_view', function() {
  var view;

  beforeEach(function() {
    ServiceValidToken.prototype.fetch = function(a) {
      a.success(null, {
        oauth_valid: true
      })
    };

    view = new ServiceItem({
      model: new cdb.core.Model({
        name: "dropbox",
        title: "Dropbox",
        state: "idle",
        revoke_url: "",
        connected: true
      })
    });

    spyOn(view, '_checkToken').and.callThrough();
    spyOn(view, '_reloadWindow');
    
    view.render();
  });

  it('should check token if it is connected from the beginning', function() {
    view.initialize();
    expect(view._checkToken).toHaveBeenCalled();
  });

  describe('render', function() {

    it('should render properly', function() {
      expect(view.$('.Form-input').length).toBe(1);
      expect(view.$('.Form-input').val().toLowerCase()).toBe('connected');
      expect(view.$('.Form-input').hasClass('is-disabled')).toBeTruthy();
      expect(view.$('.js-disconnect').length).toBe(1);
      expect(view.$('.js-disconnect').text().toLowerCase()).toBe('disconnect');
    });

    it('should render when connected is changed', function() {
      view.model.set('connected', false);
      expect(view.$('.Form-input').length).toBe(0);
      expect(view.$('.js-disconnect').length).toBe(0);
      expect(view.$('.js-connect').length).toBe(1);
      expect(view.$('.js-connect').text().toLowerCase()).toContain('connect');
      expect(view.$('.js-connect .ServiceIcon').length).toBe(1);
    });

    it('should render when status is changed', function() {
      view.model.set('state', 'loading');
      expect(view.$('.js-disconnect').length).toBe(0);
      expect(view.$('.Form-rowInfoText').text().toLowerCase()).toContain('disconnecting...');
      view.model.set('connected', false);
      expect(view.$('.js-connect').length).toBe(0);
      expect(view.$('.Form-link').text().toLowerCase()).toContain('connecting...');
    });

    it('should show an error when something is wrong', function() {
      view.model.set('state', 'error');
      expect(view.$('.Form-rowInfoText--error').length).toBe(1);
      expect(view.$('.Form-rowInfoText--error .Form-link').length).toBe(2);
      expect(view.$('.Form-rowInfoText--error .js-disconnect').length).toBe(1);
      view.model.set('connected', false);
      expect(view.$('.js-connect').length).toBe(1);
    });
    
  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

});