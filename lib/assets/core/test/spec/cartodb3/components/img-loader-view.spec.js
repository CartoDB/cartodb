var ImgLoaderView = require('../../../../javascripts/cartodb3/components/img-loader-view');

describe('components/img-loader-view', function () {
  var svgResponse = {
    status: 200,
    contentType: 'image/svg+xml',
    responseText: '<svg xmlns:a="genius.com" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"><path></path></svg>'
  };
  var svgUrl = 'http://image.io/logo.svg';

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/logo.svg.*'))
      .andReturn(svgResponse);

    this.imageClass = 'Editor-fillImageAsset';
    this.view = new ImgLoaderView({
      imageClass: this.imageClass
    });

    var resourceContainer = '<div class="js-image-container"></div>';

    this.view.$el.html(resourceContainer);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('._loadImage', function () {
    it('should render resource if format is not SVG', function () {
      var imgUrl = 'http://www.imageserver.com/image.png';
      var color = '#FF0000';

      this.view._loadImage(imgUrl, color);

      var $img = this.view.$('img');
      var classes = $img.attr('class');
      var src = $img.attr('src');
      var crossOrigin = $img.attr('crossOrigin');
      $img.empty(); // To avoid DOM requests to the image file

      expect(classes.indexOf('js-image') > -1).toBe(true);
      expect(classes.indexOf(this.imageClass) > -1).toBe(true);
      expect(src).toBe(imgUrl + '?req=markup');
      expect(crossOrigin).toBe('anonymous');
    });

    it('should render SVG tag if resource is SVG file', function () {
      var color = '#cebada';

      this.view._loadImage(svgUrl, color);

      var $svg = this.view.$('svg');
      var classes = $svg.attr('class');
      var svgFill = $svg.css('fill').toLowerCase();
      var pathFill = $svg.find('path')[0].style['fill'].toLowerCase();

      expect($svg.length).toBe(1);
      expect(classes.indexOf('js-image') > -1).toBe(true);
      expect(classes.indexOf(this.imageClass) > -1).toBe(true);
      expect(svgFill === 'rgb(206, 186, 218)' || svgFill === color).toBe(true);
      expect(pathFill).toBe('inherit');
    });
  });

  describe('._requestImage', function () {
    var obj = {
      callback: function () {}
    };

    it('successful caches the response and calls the callback', function () {
      var expectedUrl = svgUrl + '?req=ajax';
      spyOn(obj, 'callback');
      this.view._lastImage.url = null;
      this.view._lastImage.content = null;
      jasmine.Ajax.requests.reset();

      this.view._requestImage(svgUrl, obj.callback);

      expect(jasmine.Ajax.requests.mostRecent().url).toBe(expectedUrl);
      expect(obj.callback).toHaveBeenCalled();
      expect(this.view._lastImage.url).toBe(expectedUrl);
      expect(this.view._lastImage.content).toBeDefined();
    });

    it('_requestImage with cached response, does not make an Ajax call and it calls the callback', function () {
      var expectedUrl = svgUrl + '?req=ajax';
      spyOn(obj, 'callback');

      this.view._requestImage(svgUrl, obj.callback);
      jasmine.Ajax.requests.reset();
      this.view._requestImage(svgUrl, obj.callback);

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
        this.view._requestImage(svgUrl, obj.callback);
      };

      expect(foo).toThrow();
    });
  });

  describe('._updateImageColor', function () {
    it('should update color style', function () {
      this.view._loadImage(svgUrl, '#c0ffee');
      this.view._updateImageColor('#cebada');

      var svgFill = this.view.$('svg').css('fill').toLowerCase();
      expect(svgFill === 'rgb(206, 186, 218)' || svgFill === '#cebada').toBe(true);
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
