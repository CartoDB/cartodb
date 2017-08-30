
  /**
   *  Displays which users are editing/viewing the
   *  current visualization.
   *
   *  - It needs the watching notifier model and the user model.
   */

  cdb.admin.WatchingNotifierView = cdb.core.View.extend({

    className:  'watching-notifier',
    tagName:    'div',

    initialize: function() {
      this.user = this.options.user;
      this._initBinds();
      this.template = cdb.templates.getTemplate('table/views/watching_notifier');
    },

    render: function() {
      var users = this._removeCurrentUser( this.model.get('users') ) || [];
      this.$el.html(this.template({ users: users }));
      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this._onModelChange, this);
    },

    _onModelChange: function() {
      var users = this._removeCurrentUser( this.model.get('users') ) || [];
      
      if (users.length > 0) {
        this
          .render()
          .show();
      } else {
        this.hide();
      }
    },

    _removeCurrentUser: function(users) {
      var self = this;
      return _.reject(users, function(name) { return name === self.user.get('username') })
    },

    show: function() {
      this.$el.addClass('active')
    },

    hide: function() {
      this.$el.removeClass('active')
    }

  });