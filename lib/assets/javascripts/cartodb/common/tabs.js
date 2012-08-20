
cdb.admin.Tabs = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, 'activate');
    },

    activate: function(name) {
      this.$('a').removeClass('selected');
      this.$('a[href$="#' + name + '"]').addClass('selected');
    },

    desactivate: function(name) {
      this.$('a[href$="#' + name + '"]').removeClass('selected');
    }
});
