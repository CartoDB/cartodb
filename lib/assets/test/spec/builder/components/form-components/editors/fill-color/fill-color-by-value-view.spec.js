
var Backbone = require('backbone');
var FillColorByValueView = require('builder/components/form-components/editors/fill-color/fill-color-by-value-view');

var FactoryModals = require('../../../../factories/modals');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

describe('components/form-components/editors/fill-color/fill-color-by-value-view', function () {
  var view;

  var CARTODB_ID = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
  var A_NUMBER_COLUMN = { val: 'a_number', label: 'a_number', type: 'number' };
  var A_TEXT_COLUMN = { val: 'category', label: 'category', type: 'string' };
  var ALL_COLUMNS = [CARTODB_ID, A_NUMBER_COLUMN, A_TEXT_COLUMN];

  function createView (options) {
    options = options || {
      model: new Backbone.Model({}),
      columns: ALL_COLUMNS,
      query: 'SELECT * from table',
      configModel: getConfigModelFixture(),
      userModel: getUserModelFixture(),
      editorAttrs: { help: '' },
      modals: FactoryModals.createModalService(),
      dialogMode: DialogConstants.Mode.FLOAT,
      valueColorInputModel: new Backbone.Model({}),
      popupConfig: {}
    };

    return new FillColorByValueView(options);
  }

  describe('render', function () {
    it('should have no leaks', function () {
      view = createView();

      expect(view).toHaveNoLeaks();
    });

    it('calls to _initViews', function () {
      view = createView();
      spyOn(view, '_initFillDialog');
      spyOn(view, '_initColorByValueInput');

      view.render();

      expect(view._initFillDialog).toHaveBeenCalled();
      expect(view._initColorByValueInput).toHaveBeenCalled();
    });
  });
});
