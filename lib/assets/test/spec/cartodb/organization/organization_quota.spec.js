var $ = require('jquery');
var cdb = require('cartodb.js');
var UserQuota = require('../../../../javascripts/cartodb/organization/organization_quota');

describe('organization/organization_quota', function() {
  beforeEach(function() {
    this.elHTML = '<div class="OrganizationUser-quota js-userQuota"></div>';
    this.model = new cdb.admin.User();

    spyOn(this.model, 'bind');

    this.view = new UserQuota({
      el: this.elHTML,
      model: this.model
    });

    this.view.render();
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('js-userQuota')).toBeTruthy();
  });

  it('should bind model changes', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:userQuota');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});