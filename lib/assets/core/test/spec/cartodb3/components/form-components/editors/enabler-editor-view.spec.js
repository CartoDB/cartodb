var Backbone = require('backbone');

describe('components/form-components/editors/enabler-editor', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      key: ''
    });
    this.view = new Backbone.Form.editors.EnablerEditor({
      key: 'key',
      model: this.model,
      label: 'hello',
      trackingClass: 'wadus',
      editor: {
        type: 'Select',
        options: ['hello', 'world']
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
    expect(this.view.value).toBe('hello');
  });

  it('should change model with empty value when check is disabled', function () {
    this.view._checkModel.set('enabled', true);
    this.view._editorComponent.setValue('hello');
    this.view._editorComponent.trigger('change', 'hello', this.view._editorComponent);
    expect(this.view._checkModel.get('enabled')).toBeTruthy();
    expect(this.view.value).toBe('hello');
    this.view._checkModel.set('enabled', false);
    expect(this.view._checkModel.get('enabled')).toBeFalsy();
    expect(this.view.$('.js-check').is(':checked')).toBeFalsy();
    expect(this.view.value).toBe('');
  });

  it('should change model with default value when check is enabled', function () {
    this.view.options.defaultValue = 'world';
    this.view._checkModel.set('enabled', true);
    expect(this.view._editorComponent.getValue()).toBe('world');
    expect(this.view.value).toBe('world');
  });

  it('should change model with empty value when default value is passed and check is disabled', function () {
    this.view.options.defaultValue = 'world';
    this.view._checkModel.set('enabled', true);
    this.view._checkModel.set('enabled', false);
    expect(this.view.value).toBe('');
  });

  it('should accept disabled option', function () {
    this.view.options.isDisabled = true;
    this.view.render();
    expect(this.view.$('.js-check').is(':disabled')).toBeTruthy();
  });

  it('should add the track class', function () {
    expect(this.view.$('.track-keySelect').length).toBe(1);
  });

  afterEach(function () {
    this.view.remove();
  });
});
