
  /**
   *  Organization users list
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
      data.user_url = '/' + this._URL.path + '/users/' + data.username + '/edit';
      // Where to positionate bar
      data.left_pos = ( this.options.used * 100 ) / this.options.total;
      // Used and available percentages
      data.used_per = (( this.model.get('quota_in_bytes') - this.model.get('remaining_quota')) * 100 ) / this.options.total;
      data.available_per = ( this.model.get('quota_in_bytes') * 100 ) / this.options.total;

      this.$el.append(this.template(data));
      return this;
    }

  });



  cdb.admin.organization.Users = cdb.core.View.extend({

    render: function() {
      this.clearSubViews();

      this.$('li').not('.list-head, .flash').remove();

      var used = 0;
      var self = this;
      this.collection.each(function(m) {
        
        var user_item = new cdb.admin.organization.UserItem({
          model: m,
          used: used,
          total: self.model.get('quota_in_bytes')
        });

        self.$el.append(user_item.render().el);
        self.addView(user_item);

        used = used + parseInt(m.get('quota_in_bytes'));
        console.log(used);
      });

      return this;
    }

  });