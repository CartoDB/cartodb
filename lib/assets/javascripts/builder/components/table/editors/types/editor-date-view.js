var Backbone = require('backbone');
var EditorBaseView = require('./editor-base-view');
var EditorDateFormModel = require('./editor-date-form-model');
require('builder/components/form-components/index');

module.exports = EditorBaseView.extend({

  tagName: 'div',
  className: 'Table-editorDate',

  initialize: function (opts) {
    EditorBaseView.prototype.initialize.apply(this, arguments);

    this._formModel = new EditorDateFormModel({
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

  clean: function () {
    this._formView.remove();
    EditorBaseView.prototype.clean.apply(this);
  }

});
