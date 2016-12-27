var _ = require('underscore');
var ImgLoaderView = require('../../../../javascripts/cartodb3/components/img-loader-view');

describe('components/img-loader-view', function () {
  beforeEach(function () {
    this.view = new ImgLoaderView({
      imageClass: 'Editor-fillImageAsset'
    });

    var resourceContainer = '<div class="js-image-container"></div>';

    this.view.$el.html(resourceContainer);
  });

  describe('._loadImage', function () {
    it('should render resource if format is not SVG', function () {
      var img = 'http://www.imageserver.com/image.png';
      var color = '#FF0000';

      this.view._loadImage(img, color);

      expect(view.$el.html().indexOf('img') !== -1).toBe(true);
    });
  });

});
