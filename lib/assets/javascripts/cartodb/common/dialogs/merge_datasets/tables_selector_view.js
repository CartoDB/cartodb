var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to select a table.
 */
module.exports = cdb.core.View.extend({

  tagName: 'select',

  events: {
    'change': '_onChangeOption'
  },

  attributes: {
    disabled: 'disabled' // enabled when tables are reset
  },

  initialize: function() {
    this.elder('initialize');

    this.model = new cdb.core.Model({});
    this.add_related_model(this.model);

    this.options.excludeFilter = this.options.excludeFilter || function() {};

    this._initVisualizations();
    this._initBinds();
    this._fetchTables();
  },

  render: function() {
    return this;
  },

  _initVisualizations: function() {
    // Taken from old code, cdb.admin.TableColumnSelector._getTables
    var visualizations = new cdb.admin.Visualizations();
    visualizations.options.set({
      type: 'table',
      per_page: 100000,
      table_data: false
    });
    this.model.set('visualizations', visualizations);
  },

  _initBinds: function() {
    var visualizations = this.model.get('visualizations');
    visualizations.bind('reset', this._onResetTables, this);
    this.add_related_model(visualizations);
  },

  _fetchTables: function() {
    // Taken from old code, cdb.admin.TableColumnSelector._getTables
    this.model.get('visualizations').fetch({
      data: {
        o: {
          updated_at: 'desc'
        },
        exclude_raster: true
      }
    });
  },

  _onResetTables: function() {
    this.model.get('visualizations')
      .chain()
      .reject(this.options.excludeFilter)
      .each(this._addVis, this);
    this.$el.prop('disabled', false);
    this.$el.trigger('change'); // pre-select 1st item
  },

  _addVis: function(vis) {
    // TODO: extracted from old code, cdb.admin.TableColumnSelector._setTables,
    //   could this be done more cleanly? E.g. why not use the table metadata model?
    this.$el.append(
      _.template('<option value="<%- value %>"><%- name %></option>', {
        value: vis.id,
        name: vis.get('name')
      })
    );
  },

  _onChangeOption: function() {
    var vis = this.model.get('visualizations').get(this.$el.val());
    this.model.set('tableData', vis ? vis.get('table') : undefined);
  }

});
