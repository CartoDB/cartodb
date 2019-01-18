var $ = require('jquery');
var ImgLoaderView = require('../../../../../../src/geo/ui/legends/base/img-loader-view.js');

describe('geo/ui/legends/custom/img-loader-view', function () {
  var svgResponse = {
    status: 200,
    contentType: 'image/svg+xml',
    responseText: '<svg xmlns:a="genius.com" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"><path></path></svg>'
  };

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/logo.svg.*'))
      .andReturn(svgResponse);

    this.svgUrl = 'http://image.io/logo.svg';
    this.color = '#cebada';

    var $el = $('<div class="js-image-container" data-icon="' + this.svgUrl + '" data-color="' + this.color + '">');

    this.imageClass = 'Legend-fillImageAsset';
    this.view = new ImgLoaderView({
      el: $el,
      imageClass: this.imageClass
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('._loadImage', function () {
    it('should render resource if format is not SVG', function () {
      this.imgUrl = 'http://www.imageserver.com/image.png';

      var $pngEl = $('<div class="js-image-container" data-icon="' + this.imgUrl + '" data-color="' + this.color + '">');

      this.imageClass = 'Legend-fillImageAsset';
      var view = new ImgLoaderView({
        el: $pngEl,
        imageClass: this.imageClass
      });

      view._loadImage();

      var $img = view.$('img');
      var classes = $img.attr('class');
      var src = $img.attr('src');
      var crossOrigin = $img.attr('crossOrigin');
      $img.empty(); // To avoid DOM requests to the image file

      expect(classes.indexOf('js-image') > -1).toBe(true);
      expect(classes.indexOf(this.imageClass) > -1).toBe(true);
      expect(src).toBe(this.imgUrl + '?req=markup');
      expect(crossOrigin).toBe('anonymous');
    });

    it('should render SVG tag if resource is SVG file', function () {
      this.view._loadImage();

      var $svg = this.view.$('svg');
      var classes = $svg.attr('class');
      var svgFill = $svg.css('fill').toLowerCase();
      var pathFill = $svg.find('path')[0].style['fill'].toLowerCase();

      expect($svg.length).toBe(1);
      expect(classes.indexOf('js-image') > -1).toBe(true);
      expect(classes.indexOf(this.imageClass) > -1).toBe(true);
      expect(svgFill === 'rgb(206, 186, 218)' || svgFill === this.color).toBe(true);
      expect(pathFill).toBe('inherit');
    });
  });

  describe('._requestImage', function () {
    var obj = {
      callback: function () {}
    };

    it('successful caches the response and calls the callback', function () {
      var expectedUrl = this.svgUrl + '?req=ajax';
      spyOn(obj, 'callback');
      this.view._lastImage.url = null;
      this.view._lastImage.content = null;
      jasmine.Ajax.requests.reset();

      this.view._requestImage(this.svgUrl, obj.callback);

      expect(jasmine.Ajax.requests.mostRecent().url).toBe(expectedUrl);
      expect(obj.callback).toHaveBeenCalled();
      expect(this.view._lastImage.url).toBe(expectedUrl);
      expect(this.view._lastImage.content).toBeDefined();
    });

    it('_requestImage with cached response, does not make an Ajax call and it calls the callback', function () {
      var expectedUrl = this.svgUrl + '?req=ajax';
      spyOn(obj, 'callback');

      this.view._requestImage(this.svgUrl, obj.callback);
      jasmine.Ajax.requests.reset();
      this.view._requestImage(this.svgUrl, obj.callback);

      expect(jasmine.Ajax.requests.mostRecent()).toBeUndefined();
      expect(obj.callback).toHaveBeenCalled();
      expect(this.view._lastImage.url).toBe(expectedUrl);
      expect(this.view._lastImage.content).toBeDefined();
    });

    it('_requestImage with error response, throws an error', function () {
      this.view._lastImage.url = null;
      this.view._lastImage.content = null;
      jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/logo.svg.*'))
        .andReturn({ status: 500 });

      var foo = function () {
        this.view._requestImage(this.svgUrl, obj.callback);
      };

      expect(foo).toThrow();
    });
  });

  describe('._isSVG', function () {
    it('behaves properly', function () {
      expect(this.view._isSVG('http://image.io/image.svg')).toBe(true);
      expect(this.view._isSVG('http://image.io/image.svg?req=ajax')).toBe(true);
      expect(this.view._isSVG('http://image.io/image.png')).toBe(false);
      expect(this.view._isSVG('http://image.io/image.png?req=markup')).toBe(false);
      expect(this.view._isSVG('')).toBe(false);
    });
  });
});
