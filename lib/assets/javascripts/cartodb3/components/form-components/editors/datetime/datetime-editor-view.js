var CoreView = require('backbone/core-view');
var $ = require('jquery');
var ENTER_KEY_CODE = 13;

var Backbone = require('backbone');
var DatetimeEditorFormModel = require('./datetime-editor-model');

module.exports = CoreView.extend({

  tagName: 'div',
  className: 'Table-editorDate',

  events: {
    'keyup': '_onKeyUp'
  },

  initialize: function (opts) {
    this._onKeyPressed = this._onKeyPressed.bind(this);

    this._formModel = new DatetimeEditorFormModel({
      date: this.model.get('value')
    }, {
      parse: true
    });

    this._setValue();
    this._formModel.bind('change', this._setValue, this);
    this.add_related_model(this._formModel);
  },

  render: function () {
    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$el.html(this._formView.render().el);

    return this;
  },

  _setValue: function () {
    this.model.set('value', this._formModel.getFormattedDate());
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
        // this._editorModel.confirm();
      } else {
        return false;
      }
    }
  },

  _onKeyUp: function () {
    this._setValue();
    this._checkValidity();
  },

  _checkValidity: function () {
    this.$el.toggleClass('has-error', !this.model.isValid());
  },

  clean: function () {
    this._formView.remove();
    this._destroyDocumentBind();
    CoreView.prototype.clean.apply(this);
  }

});
