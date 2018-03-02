var CoreView = require('backbone/core-view');
var $ = require('jquery');
var ENTER_KEY_CODE = 13;

module.exports = CoreView.extend({

  tagName: 'input',
  className: 'CDB-InputText CDB-Text',

  events: {
    'keyup': '_onValueChange',
    'change': '_onValueChange'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._editorModel = opts.editorModel;
    this._onKeyPressed = this._onKeyPressed.bind(this);
    this._onValueChange = this._onValueChange.bind(this);
  },

  render: function () {
    this.$el.val(
      this.model.get('value')
    );
    this._setFocus();
    this._initDocumentBind();
    return this;
  },

  _setFocus: function () {
    setTimeout(function () {
      this.$el.focus();
    }.bind(this), 100);
  },

  _initDocumentBind: function () {
    $(document).bind('keydown', this._onKeyPressed);
  },

  _destroyDocumentBind: function () {
    $(document).unbind('keydown', this._onKeyPressed);
  },

  _onKeyPressed: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      if (this.model.isValid()) {
        this._editorModel.confirm();
      } else {
        return false;
      }
    }
  },

  _onValueChange: function () {
    this._setValue();
    this._checkValidity();
  },

  _setValue: function () {
    this.model.set('value', this.$el.val());
  },

  _checkValidity: function () {
    this.$el.toggleClass('has-error', !this.model.isValid());
  },

  clean: function () {
    this._destroyDocumentBind();
    CoreView.prototype.clean.apply(this);
  }

});
