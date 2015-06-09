var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to select a table.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change': '_onChangeOption'
  },

  attributes: {
    disabled: 'disabled' // enabled when tables are reset
  },

  initialize: function() {
    this.elder('initialize');

    this.model = new cdb.core.Model({
      vis: this.options.vis
    });
    this.add_related_model(this.model);

    this.visualizations = new cdb.admin.Visualizations();
    this._fetchTables();
  },

  render: function() {
    return this;
  },

  _fetchTables: function() {
    // Taken from old code, cdb.admin.TableColumnSelector._getTables
    this.visualizations.options.set({
      type: 'table',
      per_page: 100000,
      table_data: false
    });

    var self = this;
    this.visualizations.bind('reset', function() {
      self.visualizations.unbind();
      self._onResetTables.apply(self, arguments);
    }, this);

    this.visualizations.fetch({
      data: {
        o: {
          updated_at: 'desc'
        },
        exclude_raster: true
      }
    });
  },

  _onResetTables: function(visualizations) {
    visualizations.chain()
      .filter(function(vis) {
        return vis.get('name') !== this.options.excludeTableName;
      }, this)
      .each(this._addVis, this);
    this.$el.prop('disabled', false);
    this.$el.trigger('change');
  },

  _addVis: function(vis) {
    // TODO: extracted from old code, cdb.admin.TableColumnSelector._setTables,
    //   could this be done more cleanly? E.g. why not use the table metadata model?
    var tableData = this.model.get('tableData');
    if (tableData) {
      var selectedTableId = tableData.id;
    }
    this.$el.append(
      _.template('<option value="<%- value %>" <%- isSelected ? "selected=\\"selected\\"" : "" %>><%- name %></option>', {
        isSelected: selectedTableId === vis.get('table').id,
        value: vis.id,
        name: vis.get('name')
      })
    );
  },

  _onChangeOption: function() {
    var id = this.$el.val();
    this.model.set('tableData', this.visualizations.get(id).get('table'));
  }

});
