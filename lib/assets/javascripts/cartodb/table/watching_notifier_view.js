
  /**
   *  Displays which users are editing/viewing the
   *  current visualization.
   *
   *  - It only needs the watching notifier model.
   */

  cdb.admin.WatchingNotifierView = cdb.core.View.extend({

    className:  'watching-notifier',
    tagName:    'div',

    initialize: function() {
      this._initBinds();
      this.template = cdb.templates.getTemplate('table/views/watching_notifier');
    },

    render: function() {
      var users = this.model.get('users') || [];
      this.$el.html(this.template({ users: users }));
      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this._onModelChange, this);
    },

    _onModelChange: function() {
      var users = this.model.get('users') || [];
      
      if (users.length > 0) {
        this
          .render()
          .show();
      } else {
        this.hide();
      }
    },

    show: function() {
      this.$el.addClass('active')
    },

    hide: function() {
      this.$el.removeClass('active')
    }

  });