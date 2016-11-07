var Backbone = require('backbone');
var template = require('./radio.tpl');
var _ = require('underscore');
var $ = require('jquery');
var TipsyTooltipView = require('../../tipsy-tooltip-view');

Backbone.Form.editors.Radio = Backbone.Form.editors.Radio.extend({

  className: 'CDB-Text CDB-Size-medium u-flex u-alignCenter',

  render: function () {
    this.constructor.__super__.render.apply(this, arguments);
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
      var item = {
        name: this.getName(),
        value: (option.val || option.val === 0) ? option.val : '',
        help: option.help,
        id: this.id,
        label: option.label
      };

      // Can't be selected and disabled simultaneously
      if (selectedVal === option.val) {
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

  remove: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }
});
