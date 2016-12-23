var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var moment = require('moment');
var DatetimeEditorModel = require('./datetime-editor-model');

module.exports = CoreView.extend({

  tagName: 'div',
  className: 'Table-editorDate',

  events: {
    'keyup': '_onKeyUp'
  },

  initialize: function () {
    var dateAttr = this.model.get('value');
    var date = {};

    if (!dateAttr) {
      date = moment().utc();
    } else {
      date = moment(dateAttr).utc();
    }

    this._formModel = new DatetimeEditorModel({
      day: date.date(),
      month: date.month(),
      year: date.year(),
      time: date.format('HH:mm:ss'),
      utcOffset: date.utcOffset()
    });
    this._formModel.bind('change', this._setValue, this);
    this.add_related_model(this._formModel);

    this._setValue();
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

  _onKeyUp: function () {
    this._setValue();
  },

  clean: function () {
    this._formView.remove();
    CoreView.prototype.clean.apply(this);
  }

});
