var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var ENTER_KEY_CODE = 13;

/**
 * A single item in the list
 *
 * @param {editors.List} options.list The List editor instance this item belongs to
 * @param {Function} options.Editor   Editor constructor function
 * @param {String} options.key        Model key
 * @param {Mixed} options.value       Value
 * @param {Object} options.schema     Field schema
 */
Backbone.Form.editors.List.Item = Backbone.Form.editors.Base.extend({

  events: {
    'click [data-action="remove"]': function (event) {
      event.preventDefault();
      this.list.removeItem(this);
    },
    'keydown input[type=text]': function (event) {
      if (event.keyCode !== ENTER_KEY_CODE) return;
      event.preventDefault();
      this.list.addItem(null, true);
      this.list.$list.find('input:last').focus();
    }
  },

  initialize: function (options) {
    EditorHelpers.setOptions(this, options);
    this.list = options.list;
    this.schema = options.schema || this.list.schema;
    this.Editor = options.Editor || Backbone.Form.editors.Text;
    this.template = options.template || this.schema.itemTemplate || this.constructor.template;
    this.errorClassName = options.errorClassName || this.constructor.errorClassName;
  },

  render: function () {
    // Create editor
    this.editor = new this.Editor({
      key: this.options.key,
      schema: this.schema,
      value: this.options.value,
      list: this.options.list,
      item: this,
      form: this.options.form,
      trackingClass: this.options.trackingClass
    }, {
      userModel: this.options.userModel,
      configModel: this.options.configModel,
      modals: this.options.modals
    }).render();

    // Create main element
    var $el = $($.trim(this.template()));

    $el.find('[data-editor]').append(this.editor.el);

    var $tooltip = $el.find('.js-remove-help');

    if ($tooltip.length) {
      this._removeTooltip();

      this._tooltip = new TipsyTooltipView({
        el: $tooltip,
        gravity: 'w',
        title: function () {
          return _t('editor.legend.tooltips.item.remove');
        }
      });
    }

    // Replace the entire element so there isn't a wrapper tag
    this.setElement($el);

    return this;
  },

  getValue: function () {
    return this.editor.getValue();
  },

  setValue: function (value) {
    this.editor.setValue(value);
  },

  focus: function () {
    this.editor.focus();
  },

  blur: function () {
    this.editor.blur();
  },

  validate: function () {
    var value = this.getValue();
    var formValues = this.list.form ? this.list.form.getValue() : {};
    var validators = this.schema.validators;
    var getValidator = this.getValidator;

    if (!validators) return null;

    // Run through validators until an error is found
    var error = null;
    _.every(validators, function (validator) {
      error = getValidator(validator)(value, formValues);

      return !!error;
    });

    // Show/hide error
    if (error) {
      this.setError(error);
    } else {
      this.clearError();
    }

    // Return error to be aggregated by list
    return error ? error : null; // eslint-disable-line
  },

  /**
   * Show a validation error
   */
  setError: function (err) {
    this.$el.addClass(this.errorClassName);
    this.$el.attr('title', err.message);
  },

  /**
   * Hide validation errors
   */
  clearError: function () {
    this.$el.removeClass(this.errorClassName);
    this.$el.attr('title', null);
  },

  _removeTooltip: function () {
    if (this._tooltip) {
      this._tooltip.clean();
    }
  },

  remove: function () {
    this._removeTooltip();
    this.editor.remove();

    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
}, {

  /* eslint-disable */
  template: _.template('\
      <div>\
        <span data-editor></span>\
        <button type="button" data-action="remove">&times;</button>\
      </div>\
    ', null, Backbone.Form.templateSettings),
  errorClassName: 'error'
  /* eslint-enable */
});
