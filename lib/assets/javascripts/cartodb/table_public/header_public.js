cdb.open.PublicHeader = cdb.admin.Header.extend({

  events: {
  },

  initialize: function() {
    var self = this;

    this.table = this.model;
    this.table.bind('change', this.tableInfo, this);
    this.table.bind('change:dataSource', this.onSQLView, this);
    this.add_related_model(this.table);
    this.$('.clearview').hide();


  },

  setDataLayer: function(dl) {
    this.dataLayer = dl;
  },

  georeference: function(e) {
    // not in public
  },

  tableInfo: function() {
    this.$('h2.special a').html(this.table.get('name'));

    this.$('.table_description p').text(this.table.get('vizjson').description || '');

    if(this.table.get('user_name')) {
      this.$('.author a').text(this.table.get('user_name'));
      this.$('.autor').fadeIn();
    } else {
      this.$('.autor').fadeOut();
    }


  },

  onSQLView: function() {
    // not in public
  },

  clearView: function(e) {
    // not in public
  },

  _addPrivacySelector: function(ev) {
    // not in public
  },

  _changeDescription: function(e) {
    // not in public
  },

  _changeTitle: function(e) {
    // not in public
  },

  _changeTags: function(e) {
    // not in public
  }
});
