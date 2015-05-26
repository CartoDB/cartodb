var cdb = require('cartodb.js');
// var Backbone = require('backbone');

/**
 *  Form field view for edit feature metadata
 *
 */

module.exports = cdb.core.View.extend({

  events: {},

  _EDITOR_FIELD: {
    'date': cdb.admin.DateField,
    'number': cdb.admin.NumberField,
    'boolean': cdb.admin.BooleanField,
    'geometry': cdb.admin.GeometryField,
    'timestamp with time zone': cdb.admin.DateField,
    'timestamp without time zone': cdb.admin.DateField,
    'string': cdb.admin.StringField
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/feature_data/form_field/template');
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template(this.model.attributes));
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Edit field
    var editorField = this._EDITOR_FIELD[this.model.get('type')] || this._EDITOR_FIELD['string'];

    // Create subview
    var v = new editorField({
      label: false,
      readOnly: false,
      model: new cdb.core.Model({
        attribute:  this.model.get('column'),
        value:      this.model.get('value')
      })
    }).bind('ENTER', function(e) {
      debugger;
    }, this);

    this.$('.js-editField').append(v.render().el);
    this.addView(v);
  }
  
});