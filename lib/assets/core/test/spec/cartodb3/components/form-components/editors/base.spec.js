var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base');

function dispatchDocumentEvent (type, opts) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, false, true);
  if (opts.which) {
    e.which = opts.which;
  }
  document.dispatchEvent(e, opts);
}

describe('components/form-components/editors/base', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Base();
    this.view.options = {
      validators: ['required']
    };

    document.body.appendChild(this.view.el);
  });

  afterEach(function () {
    document.body.removeChild(this.view.el);
  });

  it('should take default validation', function () {
    this.view._setOptions({
      schema: {
        min: 0,
        max: 10,
        step: 1,
        showSlider: true
      }
    });
    expect(this.view.options.validators.length).toBe(1);
    expect(this.view.options.validators[0]).toBe('required');
  });

  it('should take opts validation plus the default one', function () {
    this.view._setOptions({
      schema: {
        validators: [{
          type: 'regexp',
          regexp: /^[0-9]*\.?[0-9]*$/,
          message: 'Must be valid'
        }]
      }
    });
    expect(this.view.options.validators.length).toBe(2);
    expect(this.view.options.validators[0].type).toBe('regexp');
    expect(this.view.options.validators[1]).toBe('required');
  });

  describe('document click and escape binding', function () {
    beforeEach(function () {
      this.modals = new Backbone.Model();
      this.modals.isOpen = function () {
        return this.modals.get('open') === true;
      }.bind(this);
    });

    it('without modals set', function () {
      var cb = jasmine.createSpy('cb');
      this.view.applyClickOutsideBind(cb);

      dispatchDocumentEvent('click', { target: 'body' });
      expect(cb).toHaveBeenCalled();
    });

    it('with some modal open', function () {
      var clickCB = jasmine.createSpy('clickCB');
      var escCB = jasmine.createSpy('escCB');

      this.view._setOptions({
        modals: this.modals
      });

      this.view.applyClickOutsideBind(clickCB);
      this.view.applyESCBind(escCB);

      this.modals.set('open', true);
      dispatchDocumentEvent('click', { target: 'body' });
      expect(clickCB).not.toHaveBeenCalled();

      dispatchDocumentEvent('keydown', { which: 27 });
      expect(escCB).not.toHaveBeenCalled();
    });

    it('without any modal open', function () {
      var clickCB = jasmine.createSpy('clickCB');
      var escCB = jasmine.createSpy('escCB');

      this.view._setOptions({
        modals: this.modals
      });

      this.view.applyClickOutsideBind(clickCB);
      this.view.applyESCBind(escCB);

      this.modals.set('open', false);
      dispatchDocumentEvent('click', { target: 'body' });
      expect(clickCB).toHaveBeenCalled();

      dispatchDocumentEvent('keydown', { which: 27 });
      expect(escCB).toHaveBeenCalled();
    });
  });
});
