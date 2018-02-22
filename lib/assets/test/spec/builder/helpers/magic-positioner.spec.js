var MagicPositioner = require('builder/helpers/magic-positioner');
var $ = require('jquery');

describe('helpers/magic-positioner', function () {
  beforeEach(function () {
    this.view = document.createElement('div');
    this.view.className = 'js-magicPositionerEl';
  });

  afterEach(function () {
    delete this.view;
  });

  it('should return (auto, auto, -200px, 200px)', function () {
    var cssProps = MagicPositioner({
      parentView: $(this.view),
      posX: 200,
      posY: 200
    });

    expect(cssProps.top).toBe('auto');
    expect(cssProps.right).toBe('auto');
    expect(cssProps.bottom).toBe('-200px');
    expect(cssProps.left).toBe('200px');
  });

  it('should return (auto, auto, 682px, 319px)', function () {
    $(this.view).css('width', '1440');
    $(this.view).css('height', '776');

    var cssProps = MagicPositioner({
      parentView: $(this.view),
      posX: 319,
      posY: 94
    });

    expect(cssProps.top).toBe('94px');
    expect(cssProps.right).toBe('1121px');
    expect(cssProps.bottom).toBe('auto');
    expect(cssProps.left).toBe('auto');
  });

  it('should return (auto, auto, 147px, 173px)', function () {
    $(this.view).css('width', '808');
    $(this.view).css('height', '400');

    var cssProps = MagicPositioner({
      parentView: $(this.view),
      posX: 173,
      posY: 253
    });

    expect(cssProps.top).toBe('auto');
    expect(cssProps.right).toBe('auto');
    expect(cssProps.bottom).toBe('147px');
    expect(cssProps.left).toBe('173px');
  });
});
