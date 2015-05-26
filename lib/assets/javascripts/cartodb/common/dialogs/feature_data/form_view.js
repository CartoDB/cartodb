var cdb = require('cartodb.js');
var FormFieldView = require('./form_field/form_field_view');
var AddColumnView = require('./add_column/add_column_view');
var Backbone = require('backbone');
var _ = require('underscore');

/**
 *  Form view for edit feature metadata
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'submit .js-form': '_onSubmit'
  },

  initialize: function() {
    this.model = new cdb.core.Model({ state: 'idle' });
    this.table = this.options.table;
    this.row = this.options.row;
    this.collection = new Backbone.Collection();
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
        var mdl = self._generateField(pair[0], pair[1], self.row.get(pair[0]));
        self.collection.add(mdl);
      }
    });
  },

  _generateField: function(column, type, value) {
    return new cdb.core.Model({
      column: column,
      type: type,
      value: value
    })
  },

  _renderField: function(mdl) {
    var v = new FormFieldView({
      model: mdl
    });
    this.$('.js-addField').before(v.render().el);
    this.addView(v);
  },

  _newColumn: function() {
    var newColumn = new AddColumnView({
      table: this.table
    });
    newColumn.bind('newColumn', function(d){
      // add it to the form
      var mdl = this._generateField(d.get('name'), d.get('cartodb_type'), null)
      this.collection.add(mdl);
      this._renderField(mdl);
    }, this);
    this.addView(newColumn);
    this.$el.append(newColumn.render().el);
  },

  _onSubmit: function(ev) {
    this.killEvent(ev);
  }

});
