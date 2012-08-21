
cdb.admin.Tabs = cdb.core.View.extend({

    events: {
      'click a': '_click'
    },

    initialize: function() {
      _.bindAll(this, 'activate');
      this.preventDefault = false;
    },

    activate: function(name) {
      this.$('a').removeClass('selected');
      this.$('a[href$="#' + name + '"]').addClass('selected');
    },

    desactivate: function(name) {
      this.$('a[href$="#' + name + '"]').removeClass('selected');
    },

    _click: function(e) {
      if(this.preventDefault) e.preventDefault();
      var name = $(e.target).attr('href').split('#')[1];
      this.trigger('click', name);
    },

    linkToPanel: function(panel) {
      this.preventDefault = true;
      panel.bind('tabEnabled', this.activate, this);
      this.bind('click', panel.active, panel);
    }

});
