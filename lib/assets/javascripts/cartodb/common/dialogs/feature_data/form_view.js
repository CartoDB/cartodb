var cdb = require('cartodb.js-v3');
var FormFieldView = require('./form_field/form_field_view');
var AddColumnView = require('./add_column/add_column_view');
var EditFieldModel = require('../../edit_fields/edit_field_model');
var FormCollection = require('./form_collection');
var _ = require('underscore-cdb-v3');

/**
 *  Form view for edit feature metadata
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-submit': '_onSubmit',
    'submit': '_onSubmit'
  },

  initialize: function() {
    this.model = new cdb.core.Model({ state: 'idle' });
    this.table = this.options.table;
    this.row = this.options.row;
    this.collection = new FormCollection();
    this._generateCollection();
  },

  render: function() {
    this.clearSubViews();
    this._newColumn();
    this.collection.each(this._renderField, this);
    return this;
  },

  _generateCollection: function() {
    var self = this;
    var tableSchema = this.table.get('schema');
    var hiddenColumns = this.table.hiddenColumns;

    _.each(tableSchema, function(pair) {
      if (!_.contains(hiddenColumns, pair[0])) {
        var mdl = self._generateModel(pair[0], pair[1], self.row.get(pair[0]));
        self.collection.add(mdl);
      }
    });
  },

  _generateModel: function(column, type, value) {
    return new EditFieldModel({
      attribute: column,
      value: value,
      type: type
    });
  },

  _renderField: function(mdl) {
    var v = new FormFieldView({
      fieldModel: mdl,
      table: this.table,
      row: this.row
    });
    this.$('.js-addField').before(v.render().el);
    v.bind('onSubmit', this._onSubmit, this);
    this.addView(v);
  },

  _newColumn: function() {
    var newColumn = new AddColumnView({ table: this.table });
    newColumn.bind('newColumn', function(d){
      // add it to the form
      var mdl = this._generateModel(d.get('_name'), d.get('type'), null);
      this.collection.add(mdl);
      this._renderField(mdl);
    }, this);
    this.addView(newColumn);
    this.$el.append(newColumn.render().el);
  },

  _onSubmit: function(ev) {
    this.killEvent(ev);
    
    // Check if all models are valid, if so
    // let's go my buddy!
    var invalid = this.collection.getInvalid();
    if (!invalid) {
      var attrs = this.collection.toJSON();
      this.trigger('onSubmit', attrs, this);
    } else {
      this.trigger('onError', invalid, this);
    }
  }

});
