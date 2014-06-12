
/**
 * renders a panel with all the users within the organization and allows to change permissions
 * IMPORTANT: this dialog changes the permission object but it does not save it, it's caller
 * responsability to call save on that object
 *
 * It uses a permission and a organization objects
 * usage:
 *
 * var user_list = new cdb.admin.UserList({
 *  permission: new cdb.admin.Permission(),
 *  organization: new cdb.admin.Organization()
 * })
 * parent.append(user_list.render().el);
 */

cdb.admin.UserList = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    this.permission = this.options.permission;
    this.organization = this.options.organization;
    if (!this.permission || !this.organization) {
      throw new Error("permission and organization are mandatory");
    }

    this.organization.users.bind('add', function(c, u) {
      this._renderUser(u);
    }, this);
    this.add_related_model(this.permission);
    this.add_related_model(this.organization);
    this.add_related_model(this.organization.users);
    this._userViews = {};
  },

  _renderUser: function(u) {
    var v = new cdb.admin.UserView({
      model: u,
      permission: this.permission
    });
    this._userViews[u.cid] = v;
    this.addView(v);
    this.$el.append(v.render().el);
  },

  render: function() {
    this.$el.html('');
    this.organization.users.each(this._renderUser.bind(this));
    return this;
  }

});

/**
 * renders a user list item and manage their permissions modifying acl in permissions object
 *
 */
cdb.admin.UserView = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .switch':    'toggleReadOnly',
    'click .canwrite':    'toggleWrite'
  },

  template: _.template(
    '<img src="<%- username %>" title="<%- username %>" alt="<%- username %>" />\
    <span class="ellipsis"><%- username %></span>\
    <div class="switches">\
      <a href="#canwrite" class="checkbox small light canwrite">\
        <span class="check"></span>\
        Can write\
      </a>\
      <a href="#switch" class="switch">\
        <span class="handle"></span>\
      </a>\
    </div>'),

  /**
   * needs the following attributes in options
   * - model: an user model
   * - permissions: cdb.admin.Permission object
   */
  initialize: function() {
    this.permission = this.options.permission;
    this.add_related_model(this.permission);
  },

  toggleReadOnly: function(e) {
    this.killEvent(e);
    if (this.permission.permissionsForUser(this.model)) {
      this.permission.removePermission(this.model);
    } else {
      this.permission.setPermision(this.model, 'r');
    }
    this._switchFields();
  },

  toggleWrite: function(e) {
    this.killEvent(e);
    this.permission.setPermision(this.model, 'rw');
    this._switchFields();
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    this._switchFields();
    return this;
  },

  _switchFields: function() {
    var $switch = this.$('.switch');
    var $canwrite= this.$('.canwrite');
    var perm = this.permission.permissionsForUser(this.model);

    $canwrite.removeClass('enabled').addClass('disabled');

    if (perm) {
      $switch.removeClass('disabled').addClass('enabled');
      if (perm === 'rw') {
        $canwrite.removeClass('disabled').addClass('enabled');
      }
    } else {
      $switch.removeClass('enabled').addClass('disabled');
    }
  }

});
