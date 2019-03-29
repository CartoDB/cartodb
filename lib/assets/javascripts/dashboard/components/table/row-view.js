const _ = require('underscore');
const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  tagName: 'tr',

  initialize: function () {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.clean, this);
    this.model.bind('remove', this.clean, this);
    this.model.bind('change', this.triggerChange, this);
    this.model.bind('sync', this.triggerSync, this);
    this.model.bind('error', this.triggerError, this);

    this.add_related_model(this.model);
    this.order = this.options.order;
  },

  triggerChange: function () {
    this.trigger('changeRow');
  },

  triggerSync: function () {
    this.trigger('syncRow');
  },

  triggerError: function () {
    this.trigger('errorRow');
  },

  valueView: function (colName, value) {
    return value;
  },

  render: function () {
    var self = this;
    var row = this.model;

    var tr = '';

    var tdIndex = 0;
    var td;
    if (this.options.row_header) {
      td = '<td class="rowHeader" data-x="' + tdIndex + '">';
    } else {
      td = '<td class="EmptyRowHeader" data-x="' + tdIndex + '">';
    }
    var v = self.valueView('', '');
    if (v.html) {
      v = v[0].outerHTML;
    }
    td += v;
    td += '</td>';
    tdIndex++;
    tr += td;

    var attrs = this.order || _.keys(row.attributes);
    var tds = '';
    var row_attrs = row.attributes;
    for (var i = 0, len = attrs.length; i < len; ++i) {
      var key = attrs[i];
      var value = row_attrs[key];
      if (value !== undefined) {
        td = '<td id="cell_' + row.id + '_' + key + '" data-x="' + tdIndex + '">';
        v = self.valueView(key, value);
        if (v.html) {
          v = v[0].outerHTML;
        }
        td += v;
        td += '</td>';
        tdIndex++;
        tds += td;
      }
    }
    tr += tds;
    this.$el.html(tr).attr('id', 'row_' + row.id);
    return this;
  },

  getCell: function (x) {
    if (this.options.row_header) {
      ++x;
    }
    return this.$('td:eq(' + x + ')');
  },

  getTableView: function () {
    return this.tableView;
  }

});
