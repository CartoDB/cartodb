var Backbone = require('backbone');
var InputColorFixedView = require('builder/components/form-components/editors/fill-color/inputs/input-color-fixed');

describe('components/form-components/editors/fill-color/inputs/input-color-fixed', function () {
  var inputColor;

  function createView () {
    inputColor = new InputColorFixedView({
      model: new Backbone.Model({
        type: 'color',
        fixed: '#FF0000',
        opacity: 0.90
      }),
      columns: {},
      editorAttrs: { help: '' }
    });
  }

  beforeEach(function () {
    createView();
  });

  it('renders a colorbar', function () {
    inputColor.render();

    expect(inputColor._getValue()).toContain('rgba(255, 0, 0, 0.9');
    expect(inputColor._getOpacity()).toBe(0.9);

    var colorBarBackground = inputColor.$el.find('.ColorBar')[0].style.backgroundColor;
    expect(colorBarBackground).toContain('rgba(255, 0, 0, 0.9');
  });

  it('can create a color picker to choose one', function () {
    inputColor._createContentView();
    expect(inputColor._colorPickerView).not.toBeNull();
  });
});
