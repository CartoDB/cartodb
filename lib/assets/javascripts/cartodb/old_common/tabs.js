
cdb.admin.Tabs = cdb.core.View.extend({

    events: {
      'click': '_click'
    },

    initialize: function() {
      _.bindAll(this, 'activate');
      this.preventDefault = false;
      this.activeClass = 'selected';
    },

    activate: function(name) {
      this.$('a').removeClass(this.activeClass);
      this.$('a[href$="#'+ ((this.options.slash) ? '/' : '') + name + '"]').addClass(this.activeClass);
    },

    desactivate: function(name) {
      this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').removeClass(this.activeClass);
    },

    disable: function(name) {
      this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').addClass('disabled');
    },

    enable: function(name) {
      this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').removeClass('disabled');
    },

    getTab: function(name) {
      return this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]');
    },

    disableAll: function() {
      this.$('a').addClass('disabled');
    },

    removeDisabled: function() {
      this.$('.disabled').parent().remove();
    },

    _click: function(e) {
      if (e && this.preventDefault) e.preventDefault();

      var
      t    = $(e.target).closest('a'),
      href = t.attr('href');

      if (!t.hasClass('disabled') && href) {
        var name = href.replace('#/', '#').split('#')[1];
        this.trigger('click', name);
      }
    },

    linkToPanel: function(panel) {
      this.preventDefault = true;
      panel.bind('tabEnabled', this.activate, this);
      this.bind('click', panel.active, panel);
    }

});
