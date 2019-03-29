var Backbone = require('backbone');
var FillColorFixedView = require('builder/components/form-components/editors/fill-color/fill-color-fixed-view');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

describe('components/form-components/editors/fill-color/fill-color-fixed-view', function () {
  var view;

  var CARTODB_ID = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
  var A_NUMBER_COLUMN = { val: 'a_number', label: 'a_number', type: 'number' };
  var A_TEXT_COLUMN = { val: 'category', label: 'category', type: 'string' };
  var ALL_COLUMNS = [CARTODB_ID, A_NUMBER_COLUMN, A_TEXT_COLUMN];

  function createView () {
    var fillColorFixedView = new FillColorFixedView({
      model: new Backbone.Model({
        fixed: 'red',
        opacity: 0.8
      }),
      columns: ALL_COLUMNS,
      editorAttrs: { help: '' },
      dialogMode: DialogConstants.Mode.FLOAT,
      popupConfig: {},
      fixedColorInputModel: new Backbone.Model({}),
      imageInputModel: new Backbone.Model({})
    });
    return fillColorFixedView;
  }

  describe('render', function () {
    it('should have no leaks', function () {
      view = createView();

      expect(view).toHaveNoLeaks();
    });

    it('calls to _initViews', function () {
      view = createView();
      spyOn(view, '_initFillColorInput');
      spyOn(view, '_initFillImageInput');

      view.render();

      expect(view._initFillColorInput).toHaveBeenCalled();
      expect(view._initFillImageInput).toHaveBeenCalled();
    });
  });
});
