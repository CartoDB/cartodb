var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserQuotaSliderInput = require('../../../../javascripts/cartodb/organization/organization_user_quota_slider_input');

describe('organization/organization_user_quota_slider_input', function() {
  beforeEach(function() {
    this.elHTML = '<div class="js-userQuotaSliderInput"></div>';

    this.model = new cdb.admin.User({
      quota_in_bytes: 104857600,
      db_size_in_bytes: 10485760,
      organization: {
        available_quota_for_user: 811597824
      }
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new UserQuotaSliderInput({
      el: this.elHTML,
      model: this.model
    });

    this.view.render();
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('js-userQuotaSliderInput')).toBeTruthy();
  });

  it('should bind model changes', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:quota_in_bytes');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});