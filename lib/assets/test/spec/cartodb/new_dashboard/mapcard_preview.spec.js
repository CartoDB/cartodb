var Backbone = require('backbone');
var cdb = require('cartodb.js');
var $ = require('jquery');
var MapCardPreview = require('new_dashboard/mapcard_preview');

var vizjson, view, fakeSpy;

describe('new_dashboard/mapcard_preview', function() {

  beforeEach(function() {

    var card = '<div class="MapCard MapCard--selectable">'
    + '<div class="MapCard-header js-header">'
    + '  <div class="MapCard-loader js-header-loader"></div>'
    + '</div>'
    + '</div>';

    view = new MapCardPreview({
      el: $(card).find(".js-header")
    });

    //var fakeSpy = jasmine.createSpyObj(cdb, ["size", "getUrl"]);
    //spyOn(cdb, "Image").and.returnValue(fakeSpy);
    //fakeSpy.size.and.returnValue(fakeSpy);
    //fakeSpy.getUrl.and.returnValue(fakeSpy);
    //fakeSpy.getUrl.calls.argsFor(0)[0].call(view);

    fakeSpy = jasmine.createSpyObj('cdb', ['size', 'getUrl']);
    spyOn(cdb, "Image").and.returnValue(fakeSpy);
    fakeSpy.size.and.returnValue(fakeSpy);
    fakeSpy.getUrl.and.returnValue(fakeSpy);

  });

  it('should have no leaks', function() {
    view.load(vizjson);
    expect(view).toHaveNoLeaks();
  });

  it('should attempt to create an image', function() {
    view.load(vizjson);
    expect(cdb.Image).toHaveBeenCalled();
  });

  it('should request an image with default width and height', function() {
    view.load(vizjson);
    expect(fakeSpy.size.calls.argsFor(0)[0]).toEqual(300);
    expect(fakeSpy.size.calls.argsFor(0)[1]).toEqual(170);
  });

  it('should create the image preview', function(done) {
    view.load(vizjson);
    var url = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    fakeSpy.getUrl.calls.argsFor(0)[0].call(view, null, url);

    setTimeout(function() {
      expect(view.$el.find(".MapCard-preview").attr("src")).toEqual(url);
      done();
    }, 300)

  });

  it('should create the image preview', function(done) {
    view.load(vizjson);
    fakeSpy.getUrl.calls.argsFor(0)[0].call(view, true);

    setTimeout(function() {
      expect(view.$el.find(".MapCard-error").length).toEqual(1);
      done();
    }, 300);

  });

  afterEach(function() {
    view.clean();
  });

});
