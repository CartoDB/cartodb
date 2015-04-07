
  /**
   *  Organization users-list classes
   */


  /**
   *  User item view
   *
   *  - It renders user data.
   *  - Needs a user model + organization total quota.
   *  - Displays disk quota used by the user.
   *
   *
   *    new cdb.admin.organization.UserItem({
   *      model: m,
   *      used: used,
   *      total: organization_model.get('quota_in_bytes') // For example! :D
   *    });
   *
   */


  cdb.admin.organization.UserItem = cdb.core.View.extend({

    _URL: {
      path: 'organization'
    },

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('organization/views/users_list_item');
    },

    render: function() {
      var data = this.model.toJSON();
      // User url
      data.user_url = cdb.config.prefixUrl() + '/' + this._URL.path + '/users/' + data.username + '/edit';
      // Where to positionate bar
      data.left_pos = ( this.options.used * 100 ) / this.options.total;
      // Used and available percentages
      data.used_per = (( this.model.get('quota_in_bytes') - this.model.get('remaining_quota')) * 100 ) / this.options.total;
      data.available_per = ( this.model.get('quota_in_bytes') * 100 ) / this.options.total;
      // User quota for tooltip
      data.bytes_used = cdb.Utils.readablizeBytes(data.quota_in_bytes - data.remaining_quota);
      data.bytes_total = cdb.Utils.readablizeBytes(data.quota_in_bytes);

      this.$el.append(this.template(data));

      // Tipsy
      this.$("div.progress-bar").tipsy({
        fade: true,
        gravity: "s",
        delayOut: 300,
        offset: 5
      });

      return this;
    },

    clean: function() {
      if (this.$('div.progress-bar').data('tipsy')) {
        this.$el.unbind('mouseenter mouseleave');
        this.$el.data('tipsy').remove();
      }
      cdb.core.View.prototype.clean.call(this);
    }

  });

  
  /**
   *  Not enough users view
   *
   *  - Display this message when there is only one
   *  user in the organization
   */

  cdb.admin.organization.NoUsers = cdb.core.View.extend({

    tagName: 'li',
    className: 'alone',

    _TEXTS: {
      alone: _t('Feeling alone? <a href="<%- new_organization_user %>">Add more users</a> to your organization')
    },

    render: function() {
      var text = _.template(this._TEXTS.alone)(this.options.paths);

      this.$el.html('<p class="center">' + text + '</p>');

      return this;
    }

  });




  /**
   *  List view
   *
   *  - It controls user items.
   *  - It needs a users collection.
   *  - And the organization model.
   *
   *  
   *    new cdb.admin.organization.Users({
   *      model: organization_model,
   *      collection: user_collection
   *    });
   *
   */

  cdb.admin.organization.UsersList = cdb.core.View.extend({

    render: function() {
      this.clearSubViews();

      this.$el.html('');

      var used = 0;
      var self = this;
      
      // Render organization users
      this.collection.each(function(m) {  
        var user_item = new cdb.admin.organization.UserItem({
          model: m,
          used: used,
          total: self.model.get('quota_in_bytes')
        });

        self.$el.append(user_item.render().el);
        self.addView(user_item);

        used += parseInt(m.get('quota_in_bytes'));
      });

      // Not enough users?
      if (( this.model.get('seats') > this.collection.size() ) && this.collection.length < 2) {
        var no_users = new cdb.admin.organization.NoUsers({
          paths: this.options.paths
        });

        this.$el.append(no_users.render().el);
        this.addView(no_users);
      }

      return this;
    }

  });