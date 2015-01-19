var Router = require('new_dashboard/router');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_dashboard/router", function() {
  describe('given a currentUserUrl', function() {
    beforeEach(function() {
      this.user = new cdbAdmin.User({
        username: 'pepe'
      });
      this.currentUserUrl = new UserUrl({
        user: this.user
      });

      this.modelStub = jasmine.createSpyObj('RouterModel', ['set']);
      this.ModelSpy = jasmine.createSpy('RouterModel');
      this.ModelSpy.and.returnValue(this.modelStub);
      Router.__set__('RouterModel', this.ModelSpy);

      this.router = new Router({
        currentUserUrl: this.currentUserUrl
      });
    });

    it('should have created a router model with currentUserUrl', function() {
      var modelCreatedWith = this.ModelSpy.calls.argsFor(0)[0];
      expect(modelCreatedWith).toEqual(jasmine.objectContaining({ currentUserUrl: this.currentUserUrl }))
    });

    it('should have a model available as property', function() {
      expect(this.router.model).toEqual(this.modelStub);
    });
  });
});
