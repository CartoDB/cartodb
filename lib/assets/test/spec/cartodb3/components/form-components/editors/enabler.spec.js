var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/enabler/enabler-view.js');

describe('components/form-components/editors/enabler', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      enabler: false
    });

    this.view = new Backbone.Form.editors.Enabler({
      model: this.model,
      title: 'hello',
      key: 'enabler'
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
      this.$input = function () {
        return this.view.$('.js-input');
      };
    });

    it('should create the checkbox properly', function () {
      expect(this.$input().length).toBe(1);
      expect(this.$input().is(':checked')).toBeFalsy();
    });

    it('should start checked from the beginning if key is true', function () {
      this.model.set('enabler', true);
      this.view._initViews();
      expect(this.$input().is(':checked')).toBeTruthy();
    });

    it('should disable checkbox if option is false', function () {
      this.view.options.disabled = true;
      this.view._initViews();
      expect(this.$input().is(':checked')).toBeFalsy();
      expect(this.$input().is(':disabled')).toBeTruthy();
    });

    it('should add help and help tooltip', function () {
      this.view.options.help = 'help!';
      this.view._initViews();
      expect(this.view.$('.js-help').length).toBe(1);
      expect(this.view._helpTooltip).toBeDefined();
    });
  });

  it('should trigger event when input changes', function () {
    var bindSpy = jasmine.createSpy('callback');
    expect(this.model.get('enabler')).toBeFalsy();
    this.view.bind('change', bindSpy);
    this.view.$('.js-input').attr('checked', '').trigger('change');
    expect(this.model.get('enabler')).toBeTruthy();
    expect(bindSpy).toHaveBeenCalled();
  });

  it('should set value properly', function () {
    this.view.setValue(true);
    expect(this.model.get('enabler')).toBeTruthy();
    expect(this.view.$('.js-input').is(':checked')).toBeTruthy();
    this.view.setValue(false);
    expect(this.model.get('enabler')).toBeFalsy();
    expect(this.view.$('.js-input').is(':checked')).toBeFalsy();
  });

  it('should set value properly', function () {
    this.view.setValue(true);
    expect(this.model.get('enabler')).toBeTruthy();
    expect(this.view.$('.js-input').is(':checked')).toBeTruthy();
    this.view.setValue(false);
    expect(this.model.get('enabler')).toBeFalsy();
    expect(this.view.$('.js-input').is(':checked')).toBeFalsy();
  });

  it('should remove help tooltip if it is defined', function () {
    this.view.options.help = 'hello';
    this.view._initViews();
    spyOn(this.view, '_removeTooltip');
    this.view.remove();
    expect(this.view._removeTooltip).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.remove();
  });
});
