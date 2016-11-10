var MagicPositioner = require('../../../../javascripts/cartodb3/helpers/magic-positioner');
var $ = require('jquery');

describe('helpers/magic-positioner', function () {
  beforeEach(function () {
    var view = document.createElement('div');
    view.className = 'js-magicPositionerEl';
    this.parentView = $.fn.init(view);
  });

  afterEach(function () {
    this.parentView.remove();
  });

  it('should return (auto, auto, -200px, 200px)', function () {
    var cssProps = MagicPositioner({
      parentView: this.parentView,
      posX: 200,
      posY: 200
    });

    expect(cssProps.top).toBe('auto');
    expect(cssProps.right).toBe('auto');
    expect(cssProps.bottom).toBe('-200px');
    expect(cssProps.left).toBe('200px');
  });

  it('should return (94px, 1121px, auto, auto)', function () {
    this.parentView.css('width', '1440');
    this.parentView.css('height', '776');

    var cssProps = MagicPositioner({
      parentView: this.parentView,
      posX: 319,
      posY: 94
    });

    expect(cssProps.top).toBe('94px');
    expect(cssProps.right).toBe('1121px');
    expect(cssProps.bottom).toBe('auto');
    expect(cssProps.left).toBe('auto');
  });

  it('should return (auto, auto, 147px, 173px)', function () {
    this.parentView.css('width', '808');
    this.parentView.css('height', '400');

    var cssProps = MagicPositioner({
      parentView: this.parentView,
      posX: 173,
      posY: 253
    });

    expect(cssProps.top).toBe('auto');
    expect(cssProps.right).toBe('auto');
    expect(cssProps.bottom).toBe('147px');
    expect(cssProps.left).toBe('173px');
  });
});
