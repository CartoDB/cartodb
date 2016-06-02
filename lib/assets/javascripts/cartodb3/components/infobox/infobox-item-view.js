var cdb = require('cartodb.js');
var template = require('./infobox.tpl');
var templateButton = require('./infobox-button.tpl');

var INFOBOX_TYPE = {
  error: 'is-error',
  alert: 'is-alert',
  default: ''
};

module.exports = cdb.core.View.extend({
  events: {
    'click .js-primary .js-action': '_onMainClick',
    'click .js-secondary .js-action': '_onSecondClick'
  },

  initialize: function (opts) {
    if (!opts.title) throw new Error('Title is required');
    if (!opts.body) throw new Error('Body is required');

    this._title = opts.title;
    this._body = opts.body;

    if (opts.mainAction) {
      this._mainLabel = opts.mainAction.label;
      this._mainType = opts.mainAction.type;
    }

    if (opts.secondAction) {
      this._secondLabel = opts.secondAction.label;
      this._secondType = opts.secondAction.type;
    }

    this._type = INFOBOX_TYPE[opts.type || 'default'];
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var hasButtons = this._mainLabel || this._secondLabel;

    var view = template({
      title: this._title,
      body: this._body,
      type: this._type,
      hasButtons: hasButtons
    });

    this.setElement(view);

    if (this._mainLabel) {
      this.$('.js-primary').html(templateButton({
        label: this._mainLabel,
        type: this._mainType
      }));
    }

    if (this._secondLabel) {
      this.$('.js-secondary').html(templateButton({
        label: this._secondLabel,
        type: this._secondType
      }));
    }
  },

  _onMainClick: function () {
    this.trigger('action:main');
  },

  _onSecondClick: function () {
    this.trigger('action:second');
  }
});
