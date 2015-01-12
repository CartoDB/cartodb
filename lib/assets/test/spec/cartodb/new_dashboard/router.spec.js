var Router = require('new_dashboard/router');

describe("new_dashboard/router", function() {
  beforeEach(function() {
    this.rootUrl = 'http://pepe.cartodb.com/';

    this.router = new Router({
      rootUrl: this.rootUrl
    });
  });

  it('should have a model', function() {
    expect(this.router.model).toEqual(jasmine.any(Object));
  });

  it('should have created a router model with root URL', function() {
    this.modelStub = jasmine.createSpyObj('RouterModel', ['set']);
    this.ModelSpy = jasmine.createSpy('RouterModel');
    this.ModelSpy.and.returnValue(this.modelStub);
    Router.__set__('RouterModel', this.ModelSpy);
    this.router = new Router({
      rootUrl: this.rootUrl
    });

    var modelCreatedWith = this.ModelSpy.calls.argsFor(0)[0];
    expect(modelCreatedWith).toEqual(jasmine.objectContaining({ rootUrl: 'http://pepe.cartodb.com' }))
  });
});
