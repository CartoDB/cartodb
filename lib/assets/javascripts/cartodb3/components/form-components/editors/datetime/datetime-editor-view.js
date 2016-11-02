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

    if (!dateAttr) {
      data = {
        day: moment().date(),
        month: moment().month(),
        year: moment().year(),
        time: this._getFormattedTime(moment().utc()),
        utcOffset: moment().utcOffset()
      };
    } else {
      var date = moment(dateAttr).utc();

      data = {
        day: date.date(),
        month: date.month(),
        year: date.year(),
        time: this._getFormattedTime(date),
        utcOffset: date.utcOffset()
      };
    }
    this._formModel = new DatetimeEditorModel(data);
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

  _getFormattedTime: function (momentObj) {
    return momentObj.format('HH') + ':' + momentObj.format('mm') + ':' + momentObj.format('ss');
  },

  clean: function () {
    this._formView.remove();
    CoreView.prototype.clean.apply(this);
  }

});
