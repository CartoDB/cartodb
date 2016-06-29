var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');

var REQUIRED_OPTS = [
  'template',
  'onEdit',
  'renderOptions'
];

var DBLCLICK_TIMEOUT = 200;
var clicks = 0;

module.exports = CoreView.extend({
  events: {
    'blur .js-input': 'hide',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    if (opts.onClick) {
      this._hasDoubleClick = true;
      this._onClick = opts.onClick;
      this.delegateEvents(_.extend(this.events, {'click .js-title': '_onClickHandler'}));
    } else {
      this.delegateEvents(_.extend(this.events, {'dblclick .js-title': 'edit'}));
    }

    this._timeout = opts.timeout || DBLCLICK_TIMEOUT;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _onClickHandler: function (e) {
    var self = this;
    clicks++;
    if (clicks === 1) {
      setTimeout(function () {
        if (clicks === 1) {
          self._onClick(e);
        } else {
          self.edit();
        }
        clicks = 0;
      }, this._timeout);
    }
  },

  _initViews: function () {
    this.$el.append(this._template(this._renderOptions));
    this.setElement(this.$('.Inline-editor'));
  },

  edit: function () {
    this.$('.js-input').prop('readonly', false).show().focus();
    this.$('.js-input').get(0).setSelectionRange(0, this.$('.js-input').val().length);
  },

  getValue: function () {
    return this.$('.js-input').val();
  },

  hide: function () {
    this.$('.js-input').prop('readonly', true).hide();
  },

  _onKeyUpInput: function (e) {
    if (e.which === $.ui.keyCode.ESCAPE) {
      this.hide();
    }

    if (e.which === $.ui.keyCode.ENTER) {
      this._onEdit && this._onEdit();
    }
  }
});
