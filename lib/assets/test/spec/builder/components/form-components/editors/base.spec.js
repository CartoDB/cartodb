var Backbone = require('backbone');
var FactoryModals = require('../../../factories/modals');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

function dispatchDocumentEvent (type, opts) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, false, true);
  if (opts.which) {
    e.which = opts.which;
  }
  document.dispatchEvent(e, opts);
}

describe('components/form-components/editors/base', function () {
  var view;

  beforeEach(function () {
    view = new Backbone.Form.editors.Base();
    view.options = {
      validators: ['required']
    };

    document.body.appendChild(view.el);
  });

  afterEach(function () {
    var parent = view.el.parentNode;
    parent && parent.removeChild(view.el);
    view.remove();
  });

  it('should take default validation', function () {
    EditorHelpers.setOptions(view, {
      schema: {
        min: 0,
        max: 10,
        step: 1,
        showSlider: true
      }
    });
    expect(view.options.validators.length).toBe(1);
    expect(view.options.validators[0]).toBe('required');
  });

  it('should take opts validation plus the default one', function () {
    EditorHelpers.setOptions(view, {
      schema: {
        validators: [{
          type: 'regexp',
          regexp: /^[0-9]*\.?[0-9]*$/,
          message: 'Must be valid'
        }]
      }
    });
    expect(view.options.validators.length).toBe(2);
    expect(view.options.validators[0].type).toBe('regexp');
    expect(view.options.validators[1]).toBe('required');
  });

  describe('document click and escape binding', function () {
    beforeEach(function () {
      this.modals = FactoryModals.createModalService();
    });

    it('without modals set', function () {
      var cb = jasmine.createSpy('cb');
      view.applyClickOutsideBind(cb);

      dispatchDocumentEvent('click', { target: 'body' });
      expect(cb).toHaveBeenCalled();
    });

    it('with some modal open', function () {
      var clickCB = jasmine.createSpy('clickCB');
      var escCB = jasmine.createSpy('escCB');

      EditorHelpers.setOptions(view, {
        modals: this.modals
      });

      view.applyClickOutsideBind(clickCB);
      view.applyESCBind(escCB);

      this.modals.set('open', true);
      dispatchDocumentEvent('click', { target: 'body' });
      expect(clickCB).not.toHaveBeenCalled();

      dispatchDocumentEvent('keydown', { which: 27 });
      expect(escCB).not.toHaveBeenCalled();
    });

    it('without any modal open', function () {
      var clickCB = jasmine.createSpy('clickCB');
      var escCB = jasmine.createSpy('escCB');

      EditorHelpers.setOptions(view, {
        modals: this.modals
      });

      view.applyClickOutsideBind(clickCB);
      view.applyESCBind(escCB);

      this.modals.set('open', false);
      dispatchDocumentEvent('click', { target: 'body' });
      expect(clickCB).toHaveBeenCalled();

      dispatchDocumentEvent('keydown', { which: 27 });
      expect(escCB).toHaveBeenCalled();
    });
  });
});
