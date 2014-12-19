var Router = require('new_dashboard/router');

describe("new_dashboard/router", function() {
  beforeEach(function() {
    this.rootUrl = 'http://pepe.cartodb.com/';

    this.urlsModelStub = jasmine.createSpyObj('RouteRUrlsModel', ['bind']);
    this.UrlsModelSpy = jasmine.createSpy('RouterUrlsModel');
    this.UrlsModelSpy.and.returnValue(this.urlsModelStub);
    Router.__set__('UrlsModel', this.UrlsModelSpy);

    this.router = new Router({
      rootUrl: this.rootUrl
    });
  });

  it('should have a urls model', function() {
    expect(this.router.urls).toBe(this.urlsModelStub);
  });

  it('should have created UrlsModel with a routermodel and given root URL', function() {
    var newCalledWith = this.UrlsModelSpy.calls.argsFor(0)[0];
    expect(newCalledWith).toEqual(jasmine.objectContaining({ routerModel: this.router.model }));
    expect(newCalledWith).toEqual(jasmine.objectContaining({ rootUrl: 'http://pepe.cartodb.com' }));
  });
});
