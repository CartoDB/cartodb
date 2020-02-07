var ImgLoaderView = require('builder/components/img-loader-view');
var $ = require('jquery');

describe('components/img-loader-view', function () {
  var svgResponse = {
    status: 200,
    contentType: 'text',
    mimeType: 'image/svg+xml',
    responseText: '<svg xmlns:a="genius.com" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"><path></path><rect id="rfill"></rect><rect id="rnone" style="fill:none"></rect></svg>'
  };
  var imgResponse = {
    status: 200,
    contentType: 'text',
    mimeType: 'image/png',
    responseText: 'myimage'
  };

  var svgUrl = 'http://image.io/logo.svg';
  var imgUrl = 'http://image.io/image.png';
  var color = '#FF0000';

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax
      .stubRequest(new RegExp('^http(s)?.*/logo.svg.*'))
      .andReturn(svgResponse);

    jasmine.Ajax
      .stubRequest(new RegExp('^http(s)?.*/image.png.*'))
      .andReturn(imgResponse);

    this.imageClass = 'Editor-fillImageAsset';
    this.view = new ImgLoaderView({
      imageClass: this.imageClass,
      imageUrl: imgUrl,
      color: color
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render resource if format is not SVG', function () {
      this.view.render();

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

    it('should render SVG tag if resource is SVG file', function (done) {
      var color = '#cebada';

      this.view = new ImgLoaderView({
        imageClass: this.imageClass,
        imageUrl: svgUrl,
        color: color
      });

      this.view.render();

      setTimeout(function () {
        var $svg = $(this.view.$('svg'));
        var $image = $(this.view.$('.js-image'));
        var svgFill = $svg.css('fill').toLowerCase();
        var pathFill = $svg.find('path')[0].style['fill'].toLowerCase();
        var rectFillFill = $svg.find('#rfill')[0].style['fill'].toLowerCase();
        var rectNoneFill = $svg.find('#rnone')[0].style['fill'].toLowerCase();
  
        expect($svg.length).toBe(1);
        expect($image.length).toBe(1);
        expect(svgFill === 'rgb(206, 186, 218)' || svgFill === color).toBe(true);
        expect(pathFill).toBe('inherit');
        expect(rectFillFill).toBe('inherit');
        expect(rectNoneFill).toBe('none');

        this.view.clean();

        done();
      }.bind(this), 1000);
    });
  });

  describe('._requestImageURL', function () {
    var obj = {
      callback: function () {}
    };

    it('successful caches the response and calls the callback', function (done) {
      var expectedUrl = svgUrl + '?req=ajax';
      spyOn(obj, 'callback');
      this.view._lastImage.url = null;
      this.view._lastImage.content = null;
      jasmine.Ajax.requests.reset();

      this.view._requestImageURL(svgUrl, obj.callback);

      setTimeout(function () {
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(expectedUrl);
        expect(obj.callback).toHaveBeenCalled();
        expect(this.view._lastImage.url).toBe(expectedUrl);
        expect(this.view._lastImage.content).toBeDefined();

        done();
      }.bind(this), 1000);


    });

    it('_requestImageURL with cached response, does not make an Ajax call and it calls the callback', function (done) {
      var expectedUrl = svgUrl + '?req=ajax';
      spyOn(obj, 'callback');

      this.view._requestImageURL(svgUrl, obj.callback);

      setTimeout(function () {
        jasmine.Ajax.requests.reset();
        this.view._requestImageURL(svgUrl, obj.callback);
      }.bind(this), 1000);

      setTimeout(function () {
        expect(jasmine.Ajax.requests.mostRecent()).toBeUndefined();
        expect(obj.callback).toHaveBeenCalled();
        expect(this.view._lastImage.url).toBe(expectedUrl);
        expect(this.view._lastImage.content).toBeDefined();

        done();
      }.bind(this), 1000);
    });

    it('should avoid requests if image url is null or undefined', function () {
      spyOn(this.view, '_requestImageURL');

      this.view._imageURL = null;
      this.view.render();
      expect(this.view._requestImageURL).not.toHaveBeenCalled();
    });

    it('_requestImageURL with error response, throws an error', function () {
      this.view._lastImage.url = null;
      this.view._lastImage.content = null;
      jasmine.Ajax
        .stubRequest(new RegExp('^http(s)?.*/logo.svg.*'))
        .andReturn({ status: 500 });

      var foo = function () {
        this.view._requestImageURL(svgUrl, obj.callback);
      };

      expect(foo).toThrow();
    });
  });

  describe('.updateImageColor', function () {
    it('should update color style', function (done) {
      this.view = new ImgLoaderView({
        imageClass: this.imageClass,
        imageUrl: svgUrl,
        color: '#c0ffee'
      });

      this.view.render();

      setTimeout(function () {
        this.view.updateImageColor('#cebada');
        var $svg = $(this.view.$('svg'));
        var svgFill = $svg.css('fill').toLowerCase();

        expect(svgFill === 'rgb(206, 186, 218)' || svgFill === '#cebada').toBe(true);
  
        this.view.clean();
        done();
      }.bind(this), 1000);
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
