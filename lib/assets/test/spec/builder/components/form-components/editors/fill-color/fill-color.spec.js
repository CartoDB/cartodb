var Backbone = require('backbone');

var FactoryModals = require('../../../../factories/modals');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

var ColorByValueView = require('builder/components/form-components/editors/fill-color/fill-color-by-value-view');

describe('components/form-components/editors/fill-color/fill-color', function () {
  var color;

  var CARTODB_ID = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
  var A_NUMBER_COLUMN = { val: 'a_number', label: 'a_number', type: 'number' };
  var A_TEXT_COLUMN = { val: 'category', label: 'category', type: 'string' };
  var ALL_COLUMNS = [CARTODB_ID, A_NUMBER_COLUMN, A_TEXT_COLUMN];

  function createFillColor (opts) {
    opts = opts || {};
    var modelOptions = {};
    if (opts.fillColor) {
      modelOptions.fillColor = opts.fillColor;
    }

    var options = {
      model: new Backbone.Model(modelOptions),
      key: 'fillColor',
      options: ALL_COLUMNS,
      query: 'SELECT * from table',
      configModel: getConfigModelFixture(),
      userModel: getUserModelFixture(),
      editorAttrs: {
        geometryName: 'point',
        help: '',
        hidePanes: []
      },
      modals: FactoryModals.createModalService(),
      dialogMode: DialogConstants.Mode.FLOAT,
      valueColorInputModel: new Backbone.Model({}),
      popupConfig: {}
    };

    if (opts.hidePanes) {
      options.editorAttrs.hidePanes = opts.hidePanes;
    }
    if (opts.columns) {
      options.options = opts.columns;
    }
    return new Backbone.Form.editors.FillColor(options);
  }

  describe('render', function () {
    it('both fixed and by value if no options passed about it', function () {
      color = createFillColor();
      color.render();

      expect(color.$('.js-menu').children().length).toBe(2);
      var labels = color.$('.js-menu > li label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.solid');
      expect(labels[1].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');
    });

    it('only fixed if hidePanes set with `value`', function () {
      color = createFillColor({
        hidePanes: ['value'],
        fillColor: {
          fixed: '#FF0000',
          opacity: 0.9
        }
      });
      color.render();

      // Menu
      expect(color.$('.js-menu').children().length).toBe(1);
      var labels = color.$('.js-menu > li label');
      expect(labels.length).toBe(1);
      expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.solid');

      // Form content
      expect(color.$('.js-content .ColorBarContainer').length).toBe(1);
      expect(color.$('.js-content li.ColorBar')[0].style.backgroundColor).toContain('rgba(255, 0, 0, 0.9');
    });

    it('only by value if hidePanes set with `fixed`', function () {
      spyOn(ColorByValueView.prototype, 'initialize');
      spyOn(ColorByValueView.prototype, 'render').and.returnValue('<div class="fake-by-value"></div>');
      color = createFillColor({
        hidePanes: ['fixed']
      });
      color.render();

      // Menu
      expect(color.$('.js-menu').children().length).toBe(1);
      var labels = color.$('.js-menu > li label');
      expect(labels.length).toBe(1);
      expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');

      expect(ColorByValueView.prototype.render).toHaveBeenCalled();
    });

    afterEach(function () {
      color.remove();
    });
  });
});
