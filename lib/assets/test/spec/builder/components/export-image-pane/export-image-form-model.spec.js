var Backbone = require('backbone');
require('backbone-forms');
var ExportImageFormModel = require('builder/editor/export-image-pane/export-image-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model', function () {
  beforeEach(function () {
    this.model = new ExportImageFormModel({
      userModel: new Backbone.Model(),
      hasGoogleBasemap: false,
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });
  });

  it('should generate schema', function () {
    expect(this.model.schema).toBeDefined();
  });

  it('should show a validation error when width is too big', function () {
    this.model.set({ width: 200000 });

    var form = new Backbone.Form({
      model: this.model
    });

    var validation = form.getEditor('width').validate();
    expect(validation.message).toBe('editor.export-image.invalid-dimension');
  });

  it('should show a validation error when height is too big', function () {
    this.model.set({ height: 200000 });

    var form = new Backbone.Form({
      model: this.model
    });

    var validation = form.getEditor('height').validate();
    expect(validation.message).toBe('editor.export-image.invalid-dimension');
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(3);
  });
});
