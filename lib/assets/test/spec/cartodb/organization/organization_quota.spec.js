var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserQuota = require('../../../../javascripts/cartodb/organization/organization_user_quota');

describe('organization/organization_user_quota', function() {
  beforeEach(function() {
    this.elHTML = '<div class="OrganizationUser-quota js-userQuota">'
    + '<input type="text" id="user_quota" value="104857600">'
    + '</div>';

    this.model = new cdb.admin.User({
      quota_in_bytes: 104857600,
      db_size_in_bytes: 10485760,
      organization: {
        available_quota_for_user: 811597824
      }
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new UserQuota({
      el: this.elHTML,
      model: this.model
    });

    this.view.render();
    this.model.set('quota_in_bytes', 157286400);
  });

  it('should render properly', function() {
    expect(this.view.$el.hasClass('js-userQuota')).toBeTruthy();
  });

  it('should bind model changes', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:quota_in_bytes');
  });

  it('should render the new quota in bytes in the hidden input element', function() {
    expect(this.view.$el.find("#user_quota").val()).toEqual('157286400');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});