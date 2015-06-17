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
    this.model = new cdb.core.Model();

    this.options.excludeFilter = this.options.excludeFilter || function() {};
    if (this.options.initialOption) {
      this._appendOption(this.options.initialOption);
    }

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
      .each(this._appendOptionByVis, this);
    this.$el.prop('disabled', false);
    this.$el.trigger('change'); // pre-select 1st item if there's no initialOption
  },

  _appendOptionByVis: function(vis) {
    // TODO: extracted from old code, cdb.admin.TableColumnSelector._setTables,
    //   could this be done more cleanly? E.g. why not use the table metadata model?
    this._appendOption({
      value: vis.id,
      label: vis.get('name')
    });
  },

  _appendOption: function(data) {
    this.$el.append(
      _.template('<option value="<%- value %>"><%- label %></option>', _.extend({
        value: '',
        label: ''
      }, data))
    );
  },

  _onChangeOption: function() {
    var vis = this.model.get('visualizations').get(this.$el.val());
    this.model.set('tableData', vis ? vis.get('table') : undefined);
  }

});
