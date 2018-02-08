var $ = require('jquery');
var MapCardPreview = require('dashboard/components/mapcard-preview-view');
var ConfigModel = require('dashboard/data/config-model');

describe('dashboard/components/mapcard-preview', function () {
  beforeEach(function () {
    this.cardHTML = '<div class="MapCard MapCard--selectable">' +
    '<div class="MapCard-header js-header">' +
    '  <div class="MapCard-loader"></div>' +
    '</div>' +
    '</div>';

    this.config = new ConfigModel({
      user_name: 'javier'
    });

    this.view = new MapCardPreview({
      el: $(this.cardHTML).find('.js-header'),
      visId: 'oooo-llll-aaaa-mmmm',
      mapsApiResource: 'javier.hello.com',
      username: 'javier',
      config: this.config
    });
  });

  it('should request an image with default width and height', function () {
    expect(this.view.options.width).toEqual(300);
    expect(this.view.options.height).toEqual(170);
  });

  it('should request an image with user defined dimensions', function () {
    var view = new MapCardPreview({
      el: $(this.cardHTML).find('.js-header'),
      visId: 'oooo-llll-aaaa-mmmm',
      mapsApiResource: 'hello.com',
      username: 'javier',
      width: 100,
      height: 99,
      config: this.config
    });

    expect(view.options.width).toEqual(100);
    expect(view.options.height).toEqual(99);
  });

  it('should pass auth tokens if specified', function () {
    this.view.options.authTokens = ['secure', 'token'];
    spyOn(this.view, '_loadImage').and.callThrough();
    this.view.load();
    expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'http://javier.hello.com/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png?auth_token=secure&auth_token=token');
  });

  describe('with vis_id', function () {
    beforeEach(function () {
      spyOn(this.view, '_loadImage').and.callThrough();
    });

    it('should generate the image template', function () {
      expect(this.view._generateImageTemplate()).toEqual('tpl_oooo_llll_aaaa_mmmm');
    });

    it('should generate the image url', function () {
      this.view.load();
      expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'http://javier.hello.com/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png');
    });

    it('should generate the image URL with the right protocol', function () {
      spyOn(this.view, '_isHTTPS').and.returnValue(true);
      this.view.load();
      expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'https://javier.hello.com/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png');
    });

    it('should not generate the url with username + maps api host', function () {
      this.view._mapsApiResource = 'hello.com/user/javier'; // Subdomainless type
      this.view.load();
      expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'http://hello.com/user/javier/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png');
    });
  });

  describe('with vis_id and cdn', function () {
    beforeEach(function () {
      this.config.set('cdn_url', { 'http': 'cdn.url.com', 'https': 'cdns.url.com' });
      spyOn(this.view, '_loadImage').and.callThrough();
    });

    it('should generate the image url', function () {
      this.view.load();
      expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'http://cdn.url.com/javier/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png');
    });

    it('should generate the image URL with the right protocol', function () {
      spyOn(this.view, '_isHTTPS').and.returnValue(true);
      this.view.load();
      expect(this.view._loadImage).toHaveBeenCalledWith(jasmine.any(Object), 'https://cdns.url.com/javier/api/v1/map/static/named/tpl_oooo_llll_aaaa_mmmm/300/170.png');
    });

    afterEach(function () {
      this.config.unset('cdn_url');
    });
  });

  it('should have no leaks', function () {
    this.view.load();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
