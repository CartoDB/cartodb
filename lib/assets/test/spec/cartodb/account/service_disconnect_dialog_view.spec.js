var ServiceInvalidate = require('../../../../javascripts/cartodb/common/service_models/service_invalidate_model');
var ServiceDisconnectDialog = require('../../../../javascripts/cartodb/account/service_disconnect_dialog_view');

describe('account/service_disconnect_dialog_view', function() {
  var view;

  beforeEach(function() {
    ServiceInvalidate.prototype.destroy = function(a) {
      a.success(null, {
        success: true
      })
    };
    view = new ServiceDisconnectDialog({
      model: new cdb.core.Model({
        name: "dropbox",
        title: "Dropbox",
        state: "idle",
        revoke_url: "",
        connected: false
      }),
      clean_on_hide: true,
      enter_to_confirm: false
    });

    spyOn(view, '_appendContent');
    spyOn(view, '_reloadWindow');
    view.render();
  });

  describe('render', function() {

    it("should render properly", function() {
      expect(view.$('.Dialog-header').length).toBe(1);
      expect(view.$('.Dialog-body').length).toBe(0);
      expect(view.$('.Dialog-footer').length).toBe(1);
      expect(view.$('.Dialog-footer .Button').length).toBe(2);
    });

    it("should show revoke button when revoke url is not present", function() {
      expect(view.$('.js-revoke').length).toBe(1);
    });

    it("should show revoke instructions when revoke url is present", function() {
      view.model.set('revoke_url', 'http://cartodb.com');
      view.render();
      expect(view.$('.Dialog-body').length).toBe(1);
      expect(view.$('.js-revoke').length).toBe(0);
      expect(view.$('.Button[href]').length).toBe(1);
    });

  });

  describe('revoke', function() {

    it("should change state when user clicks over button", function() {
      view.$('.js-revoke').click();
      expect(view.model.get('state')).not.toBe('idle');
    });

    it("should reload if everything goes well", function() {
      view.$('.js-revoke').click();
      expect(view._reloadWindow).toHaveBeenCalled();
    });

    it("should close the dialog if the process fails", function() {
      ServiceInvalidate.prototype.destroy = function(a) {
        a.success(null, {
          success: false
        })
      };
      spyOn(view, 'close');
      view.$('.js-revoke').click();
      expect(view.close).toHaveBeenCalled();
      expect(view.model.get('state')).toBe('error');
    });

  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function() {
    view.close();
  })

});
