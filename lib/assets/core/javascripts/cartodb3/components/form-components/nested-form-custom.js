var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

var CustomForm = Backbone.Form.extend({
  initialize: function (options) {
    Backbone.Form.prototype.initialize.call(this, options);
    this.listenTo(this.model, 'updateSchema', this.updateSchema);
  },

  updateSchema: function (schema) {
    var newFields = _.keys(schema);
    var currentFields = _.keys(this.schema);
    var field;
    var options;

    // Remove all fields not present in the new schema
    _.each(currentFields, function (key) {
      if (schema[key] == null) {
        this.fields[key].remove();
        delete this.fields[key];
      }
    }, this);

    // Creat all fields not present in the old schema
    _.each(newFields, function (key) {
      var fieldSchema = schema[key];
      if (this.schema[key] == null) {
        this.fields[key] = this.createField(key, fieldSchema);
        this.renderAddedField(key);
      } else if (!_.isEqual(this.schema[key], schema[key])) {
        // update schema for this field and render
        field = this.fields[key];
        options = _.extend({}, _.omit(field.editor.options, _.keys(schema[key])), {
          schema: schema[key]
        });
        field.editor.initialize(options);
        field.editor.delegateEvents();
        field.editor.render();
      }
    }, this);

    // update the schema
    this.schema = _.extend({}, this.schema, schema);
  },

  renderAddedField: function (fieldKey) {
    var self = this;
    var fields = this.fields;
    var $form = this.$el;
    var $ = Backbone.$;

    $form.find('[data-editors]').each(function (i, el) {
      var $container = $(el);
      var selection = $container.attr('data-editors');

      if (_.isUndefined(selection)) return;

      // Work out which fields to include
      var keys = (selection === '*')
        ? self.selectedFields || _.keys(fields)
        : selection.split(',');

      // Add them
      _.each(keys, function (key) {
        var field;
        if (key === fieldKey) {
          field = fields[key];
          $container.append(field.editor.render().el);
        }
      });
    });

    // Render standalone fields
    $form.find('[data-editors]').each(function (i, el) {
      var $container = $(el);
      var selection = $container.attr('data-editors');

      if (_.isUndefined(selection)) return;

      // Work out which fields to include
      var keys = (selection === '*')
        ? self.selectedFields || _.keys(fields)
        : selection.split(',');

      // Add them
      _.each(keys, function (key) {
        var field;
        if (key === fieldKey) {
          field = fields[key];
          $container.append(field.editor.render().el);
        }
      });
    });
  }
});

module.exports = CustomForm;
