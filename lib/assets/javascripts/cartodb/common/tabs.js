
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

    disable: function(name) {
      this.$('a[href$="#' + name + '"]').addClass('disabled');
    },

    enable: function(name) {
      this.$('a[href$="#' + name + '"]').removeClass('disabled');
    },

    disableAll: function() {
      this.$('a').addClass('disabled');
    },

    _click: function(e) {
      if(this.preventDefault) e.preventDefault();
      var t = $(e.target);
      if(!t.hasClass('disabled')) {
        var name = t.attr('href').split('#')[1];
        this.trigger('click', name);
      }
    },

    linkToPanel: function(panel) {
      this.preventDefault = true;
      panel.bind('tabEnabled', this.activate, this);
      this.bind('click', panel.active, panel);
    }

});
