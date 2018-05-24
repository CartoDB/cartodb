const CoreView = require('backbone/core-view');
const template = require('./public-table-header-view.tpl');

// On the original code, this extended a more complex base class, but the public table needs no functionality
const HeaderView = CoreView.extend({

  events: {
  },

  initialize: function () {
    this.column = this.options.column;
    this.table = this.options.table;
    this.editing_name = false;
    this.changing_type = false;
  },

  render: function () {
    this.$el.html('');
    this.$el.append(template({
      col_name: this.column[0],
      col_type: this.column[1],
      editing_name: this.editing_name
    }));

    // Focus in the input if it is being edited
    if (this.editing_name) {
      this.$el.find('input').focus();
    }

    this.delegateEvents();

    return this;
  }

});

module.exports = HeaderView;
