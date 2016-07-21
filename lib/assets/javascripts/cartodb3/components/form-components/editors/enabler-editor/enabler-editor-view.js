var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var TipsyTooltipView = require('../../../tipsy-tooltip-view');
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
    this._setOptions(opts);

    if (!this.options.editor) {
      throw new Error('editor options is required');
    }

    this._editorOptions = this.options.editor;
    this._checkModel = new Backbone.Model({
      enabled: this.model.get(opts.key)
    });
    this.template = template;

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      this.template({
        label: this.options.label,
        isChecked: this._isChecked(),
        help: this.options.help || ''
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
      this.model.set(this.options.keyAttr, '');
      this._renderComponent();
    }, this);
  },

  _isChecked: function () {
    return this._checkModel.get('enabled');
  },

  _renderComponent: function () {
    if (this._editorComponent) {
      this._editorComponent.remove();
    }

    var EditorClass = Backbone.Form.editors[this._editorOptions.type];
    var editorAttrs = _.extend(
      this._editorOptions.editorAttrs || {},
      {
        disabled: !this._isChecked()
      }
    );

    this._editorComponent = new EditorClass(
      _.extend(
        {
          model: this.model,
          key: this.options.keyAttr,
          editorAttrs: editorAttrs
        },
        _.omit(this._editorOptions, 'editorAttrs', 'type')
      )
    );
    this._editorComponent.bind('change', this._setEditorComponentValue, this);
    this.$('.js-editor').html(this._editorComponent.render().el);
  },

  _setEditorComponentValue: function () {
    this._triggerChange();
    this._editorComponent.commit();
  },

  _triggerChange: function () {
    this.trigger('change', this);
  },

  getValue: function () {
    if (this._editorComponent) {
      return this._editorComponent.getValue();
    } else {
      return '';
    }
  },

  setValue: function (value) {
    this._checkModel.set('enabled', !!value);
    if (this._editorComponent) {
      this._editorComponent.setValue(value);
    }
  },

  _onCheckClicked: function (ev) {
    this._checkModel.set('enabled', $(ev.target).is(':checked'));
  },

  remove: function () {
    if (this._editorComponent) {
      this._editorComponent.remove();
    }
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
