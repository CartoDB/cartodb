var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var template = require('./radio.tpl');
var _ = require('underscore');
var $ = require('jquery');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

Backbone.Form.editors.Radio = Backbone.Form.editors.Radio.extend({

  className: 'CDB-Text CDB-Size-medium u-flex u-alignCenter',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.apply(this, arguments);
    EditorHelpers.setOptions(this, opts);
  },

  render: function () {
    this.setOptions(this.schema.options); // It comes from the default Select editor (not ours)
    this._setHelp();
    return this;
  },

  _setHelp: function () {
    var containsHelp = _.find(this.schema.options, function (option) {
      return option.help;
    });

    if (containsHelp) {
      this._helpTooltip = this._createTooltip({
        $el: this.$('.js-help')
      });
    }
  },

  _createTooltip: function (opts) {
    return new TipsyTooltipView({
      el: opts.$el || this.$el,
      gravity: opts.gravity || 's',
      className: opts.className || '',
      offset: opts.offset || 0,
      title: function () {
        return opts.msg || $(this).data('tooltip');
      }
    });
  },

  getValue: function () {
    var value = this.$('input[type=radio]:checked').val();

    return (value === '') ? null : value;
  },

  _arrayToHtml: function (array) {
    var selectedVal = this.form.model.get(this.key);

    var items = _.map(array, function (option, index) {
      var val = option.val;

      var item = {
        name: this.getName(),
        value: (val === null) ? '' : val.toString(),
        help: option.help,
        id: this.id,
        label: option.label,
        className: option.className
      };

      // Can't be selected and disabled simultaneously
      if (selectedVal === val) {
        item.selected = true;
      } else {
        item.disabled = option.disabled;
      }

      return item;
    }, this);

    return template({
      items: items
    });
  },

  _destroyBinds: function () {},

  remove: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
