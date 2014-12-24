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

  it('should have created UrlsModel with a routermodel and given root URL', function() {
    this.modelStub = jasmine.createSpyObj('RouterModel', ['set']);
    this.ModelSpy = jasmine.createSpy('RouterModel');
    this.ModelSpy.and.returnValue(this.modelStub);
    Router.__set__('RouterModel', this.ModelSpy);
    this.router = new Router({
      rootUrl: this.rootUrl
    });

    var modelCreatedWith = this.ModelSpy.calls.argsFor(0)[0];
    expect(modelCreatedWith).toEqual(jasmine.objectContaining({ rootUrl: 'http://pepe.cartodb.com' }));
  });

  describe('given URL already contains a search string', function() {
    beforeEach(function() {
      this.modelStub = jasmine.createSpyObj('RouterModel', ['set']);
      this.ModelSpy = jasmine.createSpy('RouterModel');
      this.ModelSpy.and.returnValue(this.modelStub);
      Router.__set__('RouterModel', this.ModelSpy);

      this.router = new Router({
        rootUrl: this.rootUrl,
        window: {
          location: {
            pathname: '/search/hello%20world'
          }
        }
      });
    });

    it('should create the model with search query', function() {
      var modelCreatedWith = this.ModelSpy.calls.argsFor(0)[0];
      expect(modelCreatedWith).toEqual(jasmine.objectContaining({ q: 'hello world' }));
    });
  });

  describe('given URL already contains a tag', function() {
    beforeEach(function() {
      this.modelStub = jasmine.createSpyObj('RouterModel', ['set']);
      this.ModelSpy = jasmine.createSpy('RouterModel');
      this.ModelSpy.and.returnValue(this.modelStub);
      Router.__set__('RouterModel', this.ModelSpy);

      this.router = new Router({
        rootUrl: this.rootUrl,
        window: {
          location: {
            pathname: '/tag/my%20stuff'
          }
        }
      });
    });

    it('should create the model with tag', function() {
      var modelCreatedWith = this.ModelSpy.calls.argsFor(0)[0];
      expect(modelCreatedWith).toEqual(jasmine.objectContaining({ tag: 'my stuff' }));
    });
  });
});
