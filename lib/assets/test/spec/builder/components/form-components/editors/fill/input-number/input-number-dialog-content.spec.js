var Backbone = require('backbone');
var InputNumberDialogContent = require('builder/components/form-components/editors/fill/input-number/input-number-dialog-content');

var COLUMNS = ['schmeckles', 'flurbos'];

describe('input-number-dialog-content', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      fixed: 42,
      attribute: 'wadus'
    });
  });
  it('should set the range to fixed, fixed if no defaultRange specified', function () {
    var view = new InputNumberDialogContent({
      columns: COLUMNS,
      model: this.model
    });

    view._updateRangeValue();
    expect(this.model.get('range')).toEqual([42, 42]);
  });

  it('should set the range to the defaultRange if specified', function () {
    var view = new InputNumberDialogContent({
      columns: COLUMNS,
      model: this.model,
      editorAttrs: {
        defaultRange: [19, 87]
      }
    });

    view._updateRangeValue();
    expect(this.model.get('range')).toEqual([19, 87]);
  });
});
