
/**
 *  Public header for table view
 *
 *  - It needs a table model, config and user data.
 *    
 *    var header = new cdb.admin.Header({
 *      el:       this.$('header'),
 *      model:    table_model,
 *      user:     user_model,
 *      config:   config
 *    });
 *
 */

cdb.open.PublicHeader = cdb.admin.Header.extend({

  _SQL: 'SELECT * FROM ',

  events: {
    'click .data_download': 'exportData',
    'click header nav a':   '_onTabClick'
  },

  initialize: function() {
    this.$body = $('body');
    this.setInfo();
  },

  exportData: function() {
    var dlg = new cdb.admin.ExportTableDialog({
      model: this.model,
      config: config,
      sql: this._SQL + this.model.get('name'),
      force_http: true
    });
    this.$body.append(dlg.render().el);
    dlg.open();
  },

  setInfo: function() {
    this.$('h2').text(this.model.get('name'));
    this.$('.description p').text(this.model.get("description"));

    if(this.options.user.get('username')) {
      this.$('span.author')
        .text('by ' + this.options.user.get('username'))
        .fadeIn();
    } else {
      this.$('span.author').fadeOut();
    }
  },

  _shareVisualization: function() { /* not in public */ },
  _changeToVisualization: function(e) { /* not in public */ },
  _changePrivacy: function(ev) { /* not in public */ },
  _changeDescription: function(e) { /* not in public */ },
  _changeTitle: function(e) { /* not in public */ },
  _changeTags: function(e) { /* not in public */ },
  _onSetAttribute: function(e) { /* not in public */ },
  isVisEditable: function(e) { /* not in public */ },

  _onTabClick: function(e) {
    e.preventDefault();

    // Let's create the url ourselves //
    var url = '';
    
    // Get table id
    url += "/" + this.model.get('id') + '/public';

    // Get scenario parameter (table or map)
    if ($(e.target).attr('href').search('/map') != -1) {
      url += '/map'
    } else {
      url += '/table'
    }

    window.table_router.navigate(url, {trigger: true});
  }
});
