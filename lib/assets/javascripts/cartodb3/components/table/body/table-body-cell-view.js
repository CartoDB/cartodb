var cdb = require('cartodb.js');
var template = require('./table-body-cell.tpl');

/*
 *  Table body item
 */

module.exports = cdb.core.View.extend({

  className: 'Table-bodyItem',
  tagName: 'td',

  render: function () {
    this.clearSubViews();
    var value = this.options.value;
    var formatClass = '';

    if (value === undefined) {
      value = 'null';
    } else if (this.options.type === 'geometry') {
      value = this.options.geometry;
    }

    if (this.options.type === 'number') {
      formatClass = 'is-number';
    } else if (value === 'null') {
      formatClass = 'is-null';
    }

    this.$el.html(
      template({
        value: value,
        column: this.options.key,
        type: this.options.type,
        geometry: this.options.geometry,
        formatClass: formatClass
      })
    );

    this.$el.attr('data-column', this.options.column);

    return this;
  }

});
