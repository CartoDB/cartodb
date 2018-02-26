var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var $ = require('jquery');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var template = require('./enabler.tpl');
var templateReversed = require('./enabler-reversed.tpl');

Backbone.Form.editors.Enabler = Backbone.Form.editors.Base.extend({
  tagName: 'div',

  events: {
    'change .js-input': '_onCheckChange',
    'focus .js-input': function () {
      this.trigger('focus', this);
    },
    'blur .js-input': function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.template = opts.schema && opts.schema.editorAttrs && opts.schema.editorAttrs.reversed ? templateReversed : (opts.template || template);
    this._initViews();
  },

  _initViews: function () {
    this.$el.html(
      this.template({
        checked: this.options.disabled ? false : this.model.get(this.options.key),
        label: this.options.label,
        id: this.options.inputId,
        title: this.options.title,
        help: this.options.help || '',
        disabled: this.options.disabled
      })
    );

    if (this.options.help) {
      this._removeTooltip();

      this._helpTooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 's',
        title: function () {
          return $(this).data('tooltip');
        }
      });
    }

    if (this.options.disabled) {
      this.undelegateEvents();
    }
  },

  _onCheckChange: function () {
    var isEnabled = this.$('.js-input').is(':checked');
    this.model.set('enabler', isEnabled);
    this.trigger('change', this);
  },

  getValue: function () {
    return this.$('.js-input').is(':checked');
  },

  setValue: function (value) {
    this.$('.js-input')[value ? 'attr' : 'removeAttr']('checked', '');
    this.model.set(this.key, value);
  },

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  remove: function () {
    this._removeTooltip();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }

});
