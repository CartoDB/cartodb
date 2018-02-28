var $ = require('jquery');
var IconView = require('builder/components/icon/icon-view');
var warningIconTemplate = require('builder/components/icon/templates/warning.tpl');

describe('components/icon', function () {
  var createViewFn = function (options) {
    var view = new IconView({
      icon: options ? options.icon : void 0,
      placeholder: options ? options.placeholder : void 0
    });

    return view;
  };

  it('should throw if no icon string is provided', function () {
    expect(createViewFn).toThrow();
  });

  it('should throw if there is no template available for icon', function () {
    expect(function () {
      createViewFn({ icon: 'no-available-icon' });
    }).toThrow();
  });

  it('should render the icon if template is available', function () {
    var iconView = createViewFn({ icon: 'warning' });
    iconView.render();

    expect(iconView.el.innerHTML).toBe(warningIconTemplate());
  });

  it('should replace the placeholder with the icon view', function () {
    var iconPlaceholderTemplate = $('<div><li class="icon-placeholder"></li></div>');
    var iconTemplateResult = $('<div><li class="icon-placeholder">' + warningIconTemplate() + '</li></div>');

    var iconView = createViewFn({
      icon: 'warning',
      placeholder: iconPlaceholderTemplate.find('.icon-placeholder')
    });
    iconView.render();

    expect(iconPlaceholderTemplate.html()).toBe(iconTemplateResult.html());
  });
});
