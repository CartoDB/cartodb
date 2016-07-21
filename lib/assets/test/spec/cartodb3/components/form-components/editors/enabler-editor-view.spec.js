var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base');
require('../../../../../../javascripts/cartodb3/components/form-components/editors/enabler-editor/enabler-editor-view');

describe('components/form-components/editors/enabler-editor', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      key: ''
    });
    this.view = new Backbone.Form.editors.EnablerEditor({
      key: 'key',
      model: this.model,
      label: 'hello',
      editor: {
        type: 'Select',
        options: ['hello']
      }
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-check').length).toBe(1);
    expect(this.view.$('.js-editor').length).toBe(1);
    expect(this.view.$('.js-check').is(':checked')).toBeFalsy();
  });

  it('should render as checked when value is not empty', function () {
    this.model.set('key', 'example');
    this.view._checkModel.set('enabled', true);
    this.view.render();
    expect(this.view.$('.js-check').is(':checked')).toBeTruthy();
  });

  it('should render help tooltip', function () {
    this.view.options.help = 'HELP!';
    this.view.render();
    expect(this.view._helpTooltip).toBeDefined();
    expect(this.view.$('.js-help').length).toBe(1);
  });

  it('should change model value when editor component changes', function () {
    this.view._editorComponent.setValue('hello');
    this.view._editorComponent.trigger('change', this.view._editorComponent);
    expect(this.model.get('key')).toBe('hello');
  });

  it('should change model with empty value when check is disabled', function () {
    this.view.$('.js-check').click();
    this.view._editorComponent.setValue('hello');
    this.view._editorComponent.trigger('change', this.view._editorComponent);
    expect(this.view._checkModel.get('enabled')).toBeTruthy();
    expect(this.model.get('key')).toBe('hello');
    this.view.$('.js-check').click();
    expect(this.view._checkModel.get('enabled')).toBeFalsy();
    expect(this.view.$('.js-check').is(':checked')).toBeFalsy();
    expect(this.model.get('key')).toBe('');
  });

  afterEach(function () {
    this.view.remove();
  });
});
