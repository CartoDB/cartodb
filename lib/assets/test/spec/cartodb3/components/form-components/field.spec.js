var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../javascripts/cartodb3/components/form-components/field.js');

describe('components/form-components/field', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      test: true
    });
    this.model.schema = {
      test: {
        type: 'Text'
      }
    };

    this.form = new Backbone.Form({
      model: this.model
    });

    this.view = this.form.fields.test;
  });

  describe('render', function () {
    it('should add help tooltip when it is defined', function () {
      spyOn(this.view, '_createTooltip').and.callThrough();
      expect(this.view._helpTooltip).toBeUndefined();
      this.view.schema.help = 'hello';
      this.view.render();
      expect(this.view._createTooltip).toHaveBeenCalled();
      expect(this.view._helpTooltip).toBeDefined();
    });
  });

  describe('on error', function () {
    beforeEach(function () {
      spyOn(this.view, '_createTooltip').and.callThrough();
      this.view.setError('oh error!');
    });

    it('should add error tooltip', function () {
      expect(this.view._createTooltip).toHaveBeenCalled();
      expect(this.view._errorTooltip).toBeDefined();
    });

    it('should clean error tooltip when error is gone', function () {
      spyOn(this.view._errorTooltip, 'hideTipsy');
      spyOn(this.view._errorTooltip, 'destroyTipsy');
      this.view.clearError();
      expect(this.view._errorTooltip.hideTipsy).toHaveBeenCalled();
      expect(this.view._errorTooltip.destroyTipsy).toHaveBeenCalled();
    });
  });

  it('should provide more info with templateData function', function () {
    var templateData = this.view.templateData();
    expect("hasNestedForm" in templateData).toBeDefined();
  });

  describe('remove', function () {
    it('should delete tooltip views', function () {
      spyOn(this.view, '_destroyHelpTooltip');
      spyOn(this.view, '_destroyErrorTooltip');
      this.view.remove();
      expect(this.view._destroyHelpTooltip).toHaveBeenCalled();
      expect(this.view._destroyErrorTooltip).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.form.remove();
  });
});
