var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

/**
 * View to select a table. extends the cdb.admin.Combo to handle the tables fetch and similar.
 */
module.exports = cdb.forms.Combo.extend({

  className: 'Select',

  initialize: function() {
    this.options.width = '100%';
    this.options.disabled = true;
    this.options.extra = [this._initialOptionDataItem() || 'Loading tables…'];
    this.options.excludeFilter = this.options.excludeFilter || function() {};

    this.elder('initialize');
    this.model = this.model || new cdb.core.Model();

    this._initVisualizations();
    this._initBinds();
    this._fetchTables();
  },

  _formatResult: function(state) {
    return JSON.stringify(state);
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
    this.bind('change', this._onChangeOption, this);

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
    this.options.disabled = false;

    var filteredVisualizations = this.model.get('visualizations').reject(this.options.excludeFilter);
    var newData = _.map(filteredVisualizations, this._visToComboDataItem, this);

    // Prepend initial item to new data, if there's one
    var initialItem = this._initialOptionDataItem();
    if (initialItem) {
      newData.unshift(initialItem);
    }
    this.updateData(newData);

    // pre-select 1st item, unless there's an initialOption
    var firstFilteredVis = filteredVisualizations[0];
    if (!initialItem && firstFilteredVis) {
      this._onChangeOption(firstFilteredVis.id);
    }
  },

  _visToComboDataItem: function(vis) {
    // required data format for an option for the cdb.admin.combo…
    return this._comboDataItem(vis.get('name'), vis.id);
  },

  _initialOptionDataItem: function() {
    if (_.isObject(this.options.initialOption)) {
      var obj = this.options.initialOption;
      // required data format for an option for the cdb.admin.combo…
      return this._comboDataItem(obj.label, obj.value);
    }
  },

  _comboDataItem: function(label, value) {
    return [label, value];
  },

  _onChangeOption: function(visId) {
    var vis = this.model.get('visualizations').get(visId);
    this.model.set('tableData', vis ? vis.get('table') : undefined);
  }

});
