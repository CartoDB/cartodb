
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

    this._initBinds();
    this._userViews = {};
  },

  render: function() {
    this.$el.html('');

    this.clearSubViews();

    // If there are more than one users in the organization
    // display the option to set the same things for the whole
    // organization
    // if (this.organization.users.size() > 1) {
      this._renderAll();  
    // }

    this.organization.users.each(this._renderUser.bind(this));
    return this;
  },

  _renderUser: function(u) {
    var v = new cdb.admin.UserView({
      model:      u,
      permission: this.permission,
      vis:        this.model
    });
    this._userViews[u.cid] = v;
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _renderAll: function() {
    var v = new cdb.admin.AllInOrgView({
      users:      this.organization.users,
      permission: this.permission,
      vis:        this.model
    });
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _onChangeStatus: function() {
    // Reset permissions if visualization is private
    var privacy = this.model.get('privacy').toLowerCase();

    if (privacy === "private") {
      this.permission.acl.reset([]);
    }

    // Render again
    this.render();
  },

  _initBinds: function() {
    this.model.bind('change:privacy', this._onChangeStatus, this);

    this.organization.users.bind('add', function(mdl, c) {
      this._renderUser(mdl);
    }, this);
    this.add_related_model(this.permission);
    this.add_related_model(this.organization);
    this.add_related_model(this.organization.users);
  }

});


/**
 * renders a user list item and manage their permissions modifying acl in permissions object
 *
 */
cdb.admin.AllInOrgView = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .switch':    'toggleReadOnly',
    'click .canwrite':  'toggleWrite'
  },

  initialize: function() {
    this.users = this.options.users;
    this.vis = this.options.vis;
    this.permission = this.options.permission;
    this.template = cdb.templates.getTemplate('table/views/privacy_dialog/user_list_all');
    this._initBinds();
  },

  render: function() {
    // If it is possible to enable all users from the organization
    var switch_user_enabled = this.vis.get('privacy').toLowerCase() === "organization";
    this.$el.html(this.template({ switch_user_enabled: switch_user_enabled }));
    this._switchFields();
    return this;
  },

  toggleReadOnly: function(e) {
    this.killEvent(e);
    var self = this;
    var total_users = this.users.size();
    var read_users = this.users.filter(function(u){
      return self.permission.permissionsForUser(u) === 'rw' || self.permission.permissionsForUser(u) === 'r'
    }).length;

    if (total_users === read_users) {
      this.permission.cleanPermissions();
    } else {
      this.permission.setPermission(this.users, 'r');  
    }
  },

  toggleWrite: function(e) {
    this.killEvent(e);
    var self = this;
    var total_users = this.users.size();
    var write_users = this.users.filter(function(u){
      return self.permission.permissionsForUser(u) === 'rw'
    }).length;
    var read_users = this.users.filter(function(u){
      return self.permission.permissionsForUser(u) === 'rw' || self.permission.permissionsForUser(u) === 'r'
    }).length;
    var privacy = this.vis.get('privacy').toLowerCase();
    
    if (total_users === write_users) {
      if (privacy === "organization") {
        this.permission.setPermission(this.users, 'r');
      } else {
        this.permission.cleanPermissions();
      }
    } else if (read_users === total_users && privacy === "organization") {
      this.permission.setPermission(this.users, 'rw');
    } else if (privacy !== "organization") {
      this.permission.setPermission(this.users, 'rw');
    }
  },

  _initBinds: function() {
    this.permission.acl.bind('add remove reset change',  this._switchFields, this);
    this.add_related_model(this.permission.acl);
  },

  _switchFields: function() {
    var self = this;
    var $switch = this.$('.switch');
    var $canwrite = this.$('.canwrite');
    var active = this.vis.get('privacy').toLowerCase() !== "organization";

    var total_users = this.users.size();
    var write_users = this.users.filter(function(u){
      return self.permission.permissionsForUser(u) === 'rw'
    }).length;
    var read_users = this.users.filter(function(u){
      return self.permission.permissionsForUser(u) === 'rw' || self.permission.permissionsForUser(u) === 'r'
    }).length;

    // All org users can write?
    $canwrite.removeClass('enabled disabled')
    if (total_users === write_users) {
      $canwrite.addClass('enabled');
    } else if (!active) {
      $canwrite.addClass( total_users === read_users ? '' : 'disabled');
    }

    // All org users can read?
    $switch
      .removeClass('enabled disabled')
      .addClass( total_users === read_users ? 'enabled' : 'disabled' );
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

  /**
   * needs the following attributes in options
   * - model: an user model
   * - permissions: cdb.admin.Permission object
   */
  initialize: function() {
    this.vis = this.options.vis;
    this.permission = this.options.permission;
    this.template = cdb.templates.getTemplate('table/views/privacy_dialog/user_list_item_view');
    this._initBinds();
  },

  render: function() {
    var d = this.model.attributes;
    d.switch_user_enabled = this.vis.get('privacy').toLowerCase() === "organization";
    this.$el.html(this.template(d));
    this._switchFields();
    return this;
  },

  _initBinds: function() {
    this.permission.acl.bind('add remove reset change',  this._switchFields, this);
    this.add_related_model(this.permission);
  },

  toggleReadOnly: function(e) {
    this.killEvent(e);
    if (this.permission.permissionsForUser(this.model)) {
      this.permission.removePermission(this.model);
    } else {
      this.permission.setPermission(this.model, 'r');
    }
  },

  toggleWrite: function(e) {
    this.killEvent(e);
    var perms = this.permission.permissionsForUser(this.model);
    var active = this.vis.get('privacy').toLowerCase() !== "organization";

    if (perms) {
      this.permission.setPermission(this.model, ( perms === 'r' ? 'rw' : 'r' ));
    } else if (active) {
      // If visualization is neither organization (nor private of course)
      // read permission is included by default
      this.permission.setPermission(this.model, 'rw');
    }
  },

  _switchFields: function() {
    var $switch = this.$('.switch');
    var $canwrite = this.$('.canwrite');
    var $info = this.$('.info');
    var perm = this.permission.permissionsForUser(this.model);

    if (perm) {
      $switch.removeClass('disabled').addClass('enabled');
      $canwrite.removeClass('disabled enabled').addClass( perm === 'rw' ? 'enabled' : '' );
      $info.removeClass('disabled');
    } else {
      var active = this.vis.get('privacy').toLowerCase() !== "organization";
      $canwrite.removeClass('disabled enabled').addClass( active ? '' : 'disabled' );
      $switch.removeClass('enabled').addClass('disabled');
      $info[ active ? 'removeClass' : 'addClass' ]('disabled');
    }
  }

});
