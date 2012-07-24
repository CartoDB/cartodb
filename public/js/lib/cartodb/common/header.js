
/**
 * common header for map/table views
 */
cdb.admin.Header = cdb.core.View.extend({

  events: {
    'click .clearview': 'clearView',
    'click .status': '_addPrivacySelector',
    'click .change_title': '_changeTitle'
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
    this.$('.status')
      .addClass(this.table.get('privacy').toLowerCase())
      .html(this.table.get('privacy'));
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
  },

  _addPrivacySelector: function(ev) {
    ev.preventDefault();

    // Add privacy selector
    var privacy = this.privacy = new cdb.admin.PrivacySelector({
      model: this.table,
      direction: 'down'
    });

    this.$el.append(this.privacy.render().el);

    //TODO: fix showing many times
    this.privacy.show(ev.target);
    return false;
  },

  _changeTitle: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.EditTextDialog();
    // auto add to body
    dlg.showAtElement(e.target);
  }
});
