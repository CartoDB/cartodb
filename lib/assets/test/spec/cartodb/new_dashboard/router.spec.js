var Router = require('new_dashboard/router');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_dashboard/router", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe'
    });
    this.currentUserUrl = new UserUrl({
      user: this.user
    });

    this.rootUrlForCurrentTypeStub = jasmine.createSpy();
    spyOn(Router.prototype.rootUrlForCurrentType, 'bind').and.returnValue(this.rootUrlForCurrentTypeStub)

    this.router = new Router({
      currentUserUrl: this.currentUserUrl
    });
  });

  it('should have created a router model with rooturlForCurrentType', function() {
    expect(this.router.model.get('rootUrlForCurrentTypeFn')).toBe(this.rootUrlForCurrentTypeStub);
    expect(Router.prototype.rootUrlForCurrentType.bind).toHaveBeenCalledWith(this.router);
  });

  describe('.rootUrlForCurrentType', function() {
    beforeEach(function() {
      this.datasetsUrl = jasmine.createSpyObj('datasetsUrl', ['toDefault']);
      spyOn(this.currentUserUrl, 'datasetsUrl');
      this.currentUserUrl.datasetsUrl.and.returnValue(this.datasetsUrl);

      this.mapsUrl = jasmine.createSpyObj('mapsUrl', ['toDefault']);
      spyOn(this.currentUserUrl, 'mapsUrl');
      this.currentUserUrl.mapsUrl.and.returnValue(this.mapsUrl);
    });

    it('should return the root URL of the current dashboard', function() {
      this.router.model.set('content_type', 'datasets');
      expect(this.router.rootUrlForCurrentType()).toBe(this.datasetsUrl);

      this.router.model.set('content_type', 'maps');
      expect(this.router.rootUrlForCurrentType()).toBe(this.mapsUrl);
    });
  });
});
