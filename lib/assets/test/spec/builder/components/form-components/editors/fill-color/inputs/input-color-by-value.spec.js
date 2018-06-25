var Backbone = require('backbone');
var InputColorByValueView = require('builder/components/form-components/editors/fill-color/inputs/input-color-by-value');

var FactoryModals = require('../../../../../factories/modals');

var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');

describe('components/form-components/editors/fill-color/inputs/input-color-by-value', function () {
  var view;

  var CARTODB_ID = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
  var A_NUMBER_COLUMN = { val: 'a_number', label: 'a_number', type: 'number' };
  var A_TEXT_COLUMN = { val: 'category', label: 'category', type: 'string' };
  var ALL_COLUMNS = [CARTODB_ID, A_NUMBER_COLUMN, A_TEXT_COLUMN];

  function createView (options) {
    options = options || {
      model: new Backbone.Model({
        range: []
      }),
      columns: ALL_COLUMNS,
      configModel: getConfigModelFixture(),
      userModel: getUserModelFixture(),
      modals: FactoryModals.createModalService(),
      query: 'SELECT * from a',
      editorAttrs: { help: '' }
    };

    return new InputColorByValueView(options);
  }

  describe('initialize', function () {
    it('model can be set without colors (first use)', function () {
      view = createView();

      expect(view._getValue()).toBe(null);
      expect(view.model.get('range')).toEqual([]);
    });

    it('model can be set with colors range & string field', function () {
      view = createView();

      view.model.set('range', ['#5F4690', '#1D6996']);
      view.model.set('attribute', 'category');
      view.model.set('attribute_type', 'string');

      expect(view._getValue()).not.toBe(null);
      expect(view._getColumn()).toBe(A_TEXT_COLUMN);
    });
  });

  describe('render', function () {
    it('renders a `select by column` if no attribute is set', function () {
      view = createView();
      view.render();

      var htmlContent = view.$el.html();
      expect(htmlContent).toContain('form-components.editors.style.select-by-column');
    });

    it('renders the name of the field & a colorbar if attribute and colors are set', function () {
      view = createView();
      view.model.set('range', ['#FF0000', '#0000FF']);
      view.model.set('attribute', 'category');
      view.model.set('attribute_type', 'string');

      view.render();

      var columnName = view.$el.find('.Editor-fillContainer--Column');
      expect(columnName.html()).toContain('category');

      var colorbar = view.$el.find('.Editor-fillContainer--ColorBarContainer');
      expect(colorbar.html()).toContain('rgba(255, 0, 0, 1)');
      expect(colorbar.html()).toContain('rgba(0, 0, 255, 1)');
    });

    it('creates an input-color-value-content-view', function () {
      view = createView();
      view._createContentView();

      expect(view._inputColorValueContentView).toBeDefined();
    });
  });

  describe('events', function () {
    it('should hookup selectors with functions', function () {
      view = createView();
      expect(view.events['click']).toEqual('_onClick');
    });
  });
});
