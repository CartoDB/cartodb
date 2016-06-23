var Backbone = require('backbone');
var EditorBaseView = require('./editor-base-view');
var EditorDateFormModel = require('./editor-date-form-model');
require('../../../form-components/index');

module.exports = EditorBaseView.extend({

  tagName: 'div',
  className: 'u-flex',

  initialize: function (opts) {
    EditorBaseView.prototype.initialize.apply(this, arguments);
    this._formModel = new EditorDateFormModel({
      day: 1,
      month: 1,
      year: '1999',
      time: '00:00:00',
      gmt: '+1'
    });
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

  clean: function () {
    this._formView.remove();
    EditorBaseView.prototype.clean.apply(this);
  }

});
