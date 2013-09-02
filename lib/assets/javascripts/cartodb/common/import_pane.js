/**
 *  Create the views for the basemap chooser panes
 *
 *  Usage example:
 *
 *  this.importPane = new cdb.admin.ImportPane({
 *    template: cdb.templates.getTemplate('table/views/basemap_chooser')
 *  });
 *
*/

cdb.admin.ImportPane = cdb.core.View.extend({
  
  className: "import-pane",

  render: function() {
    this.$el.append(this.template({chosen: this.options.chosen}));
    return this;
  },

  _getExtensionsList: function(list) {
    if (list) {
      return String(list)
        .replace(/\/\(\\.\|\\\/\)\(/g, '.')
        .replace(/\?\|/g, ',')
        .replace(/\|/g, ',')
        .replace(/\)\$\/\i/g, '')
        .split(',');
    }
    
    return []
  }

});