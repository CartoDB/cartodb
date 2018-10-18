var CoreView = require('backbone/core-view');
var _ = require('underscore');
var REQUIRED_OPTS = [
  'template',
  'onEdit',
  'renderOptions'
];

var DBLCLICK_TIMEOUT = 200;
var clicks = 0;
var ESCAPE_KEY_CODE = 27;
var ENTER_KEY_CODE = 13;

module.exports = CoreView.extend({
  events: {
    'blur .js-input': 'blur',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._onClickHandler = this._onClickHandler.bind(this);
    this.edit = this.edit.bind(this);
    this.save = _.debounce(this.save, 200, true);

    this._timeout = opts.timeout || DBLCLICK_TIMEOUT;
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    this._initBinds();
    return this;
  },

  _initBinds: function () {
    if (this.options.onClick) {
      this._onClick = this.options.onClick;
      this._title().on('click', this._onClickHandler);
    } else {
      this._title().on('dblclick', this.edit);
    }
  },

  _unbindEvents: function () {
    var $title = this._title();
    $title && $title.off('click dblclick');
  },

  _onClickHandler: function (e) {
    var self = this;
    clicks++;
    if (clicks === 1) {
      setTimeout(function () {
        if (clicks === 1) {
          self._onClick && self._onClick(e);
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

  _backupText: function () {
    this._oldText = this.$('.js-title').text();
  },

  _restoreText: function () {
    this.$('.js-input').val(this._oldText);
  },

  edit: function () {
    this._backupText();
    this.$('.js-input').val(this._oldText);
    this.$('.js-input').prop('readonly', false).show().focus();
    this.$('.js-input').get(0).setSelectionRange(0, this.$('.js-input').val().length);
  },

  getValue: function () {
    return this.$('.js-input').val();
  },

  _title: function () {
    return this.$('.js-title');
  },

  hide: function () {
    this.$('.js-input').prop('readonly', true).hide();
  },

  blur: function () {
    this.save();
    this.hide();
  },

  save: function () {
    var value = this.getValue();

    if (value !== this._oldText && !_.isEmpty(value)) {
      this._onEdit && this._onEdit(value);
    }
  },

  clean: function () {
    this._unbindEvents();
    CoreView.prototype.clean.call(this);
  },

  _onKeyUpInput: function (e) {
    if (e.which === ESCAPE_KEY_CODE) {
      this._restoreText();
      this.hide();
    }

    if (e.which === ENTER_KEY_CODE) {
      this.$('.js-input').blur();
      this.save();
    }
  }
});
