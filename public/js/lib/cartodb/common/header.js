
/**
 * common header for map/table views
 */
cdb.admin.Header = cdb.core.View.extend({

  events: {
    'click .clearview': 'clearView'
  },

  initialize: function() {
    this.table = this.model;
    this.table.bind('change:name', this.tableName, this);
    this.table.bind('change:dataSource', this.onSQLView, this);
    this.add_related_model(this.table);
    this.$('.clearview').hide();
  },

  tableName: function() {
    this.$('h2.special a').html(this.table.get('name'));
  },

  onSQLView: function() {
    //TODO: change header 

    var color = this.table.sqlView ? 'orange': 'blue';
    this.$el.css({
      'background-color': color
    });
    if(this.table.isInSQLView()) {
      this.$('.clearview').show();
    } else {
      this.$('.clearview').hide();
    }
  },

  clearView: function(e) {
    e.preventDefault();
    this.table.useSQLView(null);
    return false;
  }

});
