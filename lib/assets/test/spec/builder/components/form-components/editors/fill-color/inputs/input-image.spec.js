var _ = require('underscore');
var Backbone = require('backbone');
var InputImageView = require('builder/components/form-components/editors/fill-color/inputs/input-image');

var ImageLoaderView = require('builder/components/img-loader-view');
var ConfigModel = require('builder/data/config-model');
var FactoryModals = require('../../../../../factories/modals');

describe('components/form-components/editors/fill-color/inputs/input-image', function () {
  var NO_IMAGE_TEXT = 'form-components.editors.fill.input-color.img';
  var SQUARE_ICON_URL = 'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/square-18.svg';

  var inputImageView;
  var spyOnSvgRequest;

  function createView () {
    inputImageView = new InputImageView({
      model: new Backbone.Model({
        type: 'image',
        image: null,
        kind: null
      }),
      userModel: { featureEnabled: function () { return true; } },
      configModel: new ConfigModel({ base_url: '/u/pepe' }),
      modals: FactoryModals.createModalService(),
      editorAttrs: { help: '' }
    });
  }

  beforeEach(function () {
    spyOnSvgRequest = spyOn(ImageLoaderView.prototype, '_loadSVG');
    createView();
  });

  it('renders without an image', function () {
    inputImageView.render();

    expect(inputImageView._getImageURL()).toBe('');

    var htmlContent = inputImageView.$('.Editor-fillImage').html();
    expect(htmlContent).toContain(NO_IMAGE_TEXT);

    var imgDiv = inputImageView.$('.js-image-container');
    expect(_.size(imgDiv)).toBe(0);
  });

  it('renders an image if specified', function () {
    inputImageView.model.set('image', SQUARE_ICON_URL);
    inputImageView.render();

    expect(inputImageView._getImageURL()).toBe(SQUARE_ICON_URL);

    var htmlContent = inputImageView.$('.Editor-fillImage').html();
    expect(htmlContent).not.toContain(NO_IMAGE_TEXT);

    var imgDiv = inputImageView.$('.js-image-container');
    expect(_.size(imgDiv)).toBe(1);

    expect(spyOnSvgRequest).toHaveBeenCalled();
  });

  it('can create a color file view to select assets', function () {
    inputImageView._createContentView();
    expect(inputImageView._inputColorFileView).not.toBeNull();
  });
});
