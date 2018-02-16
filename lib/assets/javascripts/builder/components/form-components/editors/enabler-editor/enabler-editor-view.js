var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var template = require('./enabler-editor.tpl');

/**
 *  Creates an element that enables another component, tested with:
 *
 *  select, number and input so far.
 */

Backbone.Form.editors.EnablerEditor = Backbone.Form.editors.Base.extend({
  tagName: 'div',
  className: 'Editor-checker u-flex u-alignCenter',

  events: {
    'click .js-check': '_onCheckClicked'
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    // Disable validators unless it's enabled
    this.validators = null;

    if (!this.options.editor) {
      throw new Error('editor options is required');
    }

    this._editorOptions = this.options.editor;
    this.value = this.model.get(opts.key);
    this._checkModel = new Backbone.Model({
      enabled: !!this.value
    });
    this.template = template;

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      this.template({
        label: this.options.label,
        isChecked: this._isChecked(),
        help: this.options.help || '',
        isDisabled: !!this.options.isDisabled,
        id: this.cid
      })
    );

    if (this.options.help) {
      this._helpTooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 's',
        offset: 0,
        title: function () {
          return $(this).data('tooltip');
        }
      });
    }

    this._renderComponent();

    return this;
  },

  _initBinds: function () {
    this._checkModel.bind('change:enabled', function (mdl, isEnabled) {
      this._manageValue(isEnabled);
      this._renderComponent();
      this._triggerChange();
    }, this);
  },

  _manageValue: function (isEnabled) {
    if (isEnabled) {
      this.validators = this.options.validators;
      this.value = this.options.defaultValue || '';
      this._editorComponent.setValue(this.options.defaultValue || '');
    } else {
      this.validators = null;
      this.value = '';
      this._editorComponent.setValue('');
    }
    this.model.set(this.options.keyAttr, this.value);
    this.validate();
  },

  _isChecked: function () {
    return this._checkModel.get('enabled');
  },

  _renderComponent: function () {
    if (this._editorComponent) {
      this._removeComponent();
    }

    var isDisabled = !this._isChecked() || this.options.isDisabled;
    var EditorClass = Backbone.Form.editors[this._editorOptions.type];
    var editorAttrs = _.extend(
      this._editorOptions.editorAttrs || {},
      {
        disabled: isDisabled
      }
    );

    this._editorComponent = new EditorClass(
      _.extend(
        {
          model: this.model,
          key: this.options.keyAttr,
          editorAttrs: editorAttrs,
          trackingClass: this.options.trackingClass,
          editorType: this._editorOptions.type
        },
        _.omit(this._editorOptions, 'editorAttrs', 'type')
      )
    );
    this._editorComponent.bind('change', this._setEditorComponentValue, this);
    this.$('.js-editor').html(this._editorComponent.render().el);

    // Not all editor implement the focus method
    try {
      this._editorComponent.focus();
    } catch (e) {}
  },

  _removeComponent: function () {
    this._editorComponent.remove();
    this._editorComponent.unbind('change', this._setEditorComponentValue, this);
  },

  _setEditorComponentValue: function () {
    this.value = this._editorComponent.getValue();
    this._triggerChange();
  },

  _triggerChange: function () {
    this.trigger('change', this);
  },

  getValue: function () {
    if (this._checkModel.get('enabled')) {
      return this._editorComponent && this._editorComponent.getValue() || '';
    } else {
      return '';
    }
  },

  setValue: function (value) {
    this._checkModel.set('enabled', !!value);
    if (this._editorComponent) {
      this._editorComponent.setValue(value);
    }
    this.value = value;
  },

  _onCheckClicked: function (ev) {
    this._checkModel.set('enabled', $(ev.target).is(':checked'));
  },

  remove: function () {
    if (this._editorComponent) {
      this._removeComponent();
    }
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
