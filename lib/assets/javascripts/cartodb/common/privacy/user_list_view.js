
/**
 * renders a panel with all the users within the organization and allows to change permissions
 * IMPORTANT: this dialog changes the permission object but it does not save it, it's caller
 * responsability to call save on that object
 *
 * It uses a permission and a organization objects
 * usage:
 *
 * var user_list = new cdb.admin.UserOrgList({
 *  permission: new cdb.admin.Permission(),
 *  organization: new cdb.admin.Organization()
 * })
 * parent.append(user_list.render().el);
 */

cdb.admin.UserOrgList = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    this.permission = this.options.permission;
    this.organization = this.options.user.organization;
    this.user = this.options.user;
    if (!this.permission || !this.organization) {
      throw new Error("permission and organization are mandatory");
    }

    this._initBinds();
    this._userViews = {};
  },

  render: function() {
    this.clearSubViews();
    this.$el.html('');

    // Render organization switches
    this._renderOrganization();

    // Organization users
    this.organization.users.each(this._renderUser.bind(this));

    // Render white gradients for scrolled list
    if (this.organization.users.size() > 3) {
      // Custom scroll code (showing gradients at the end and beginning of the content)
      var scroll = new cdb.admin.CustomScrolls({
        parent: this.$el,
        el:     this.$el
      });
    }

    return this;
  },

  _renderUser: function(u) {
    var self = this;
    // check if the user has permissions for all the related tables
    var notAllowed = this.model.get('related_tables') && this.model.get('related_tables').any(function (t) {
      return !t.permission.isOwner(self.user) && t.permission.getPermission(u) === null;
    });
    var v = new cdb.admin.UserListItem({
      model:      u,
      permission: this.permission,
      vis:        this.model,
      hasPermissions: !notAllowed
    });
    this._userViews[u.cid] = v;
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _renderOrganization: function() {
    var self = this;
    // check if the organization has permissions for all the related tables
    var notAllowed = this.model.get('related_tables') && this.model.get('related_tables').any(function (t) {
      return !t.permission.isOwner(self.user) && t.permission.getPermission(self.organization) === null;
    });
    var v = new cdb.admin.OrgListItem({
      model:          this.organization,
      permission:     this.permission,
      vis:            this.model,
      template:       'common/views/privacy_dialog/user_list_all',
      hasPermissions: !notAllowed
    });
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _onChangeStatus: function() {
    // Reset permissions if visualization is private
    var privacy = this.model.get('privacy').toLowerCase();

    if (privacy === "private") {
      this.permission.cleanPermissions();
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
 *  Renders a user list item and manage their permissions
 *  modifying acl in permissions object.
 *
 *  - It needs:
 *    · A user or organization model
 *    · A visualization model.
 *    · A permission model.
 *  
 *  new cdb.admin.UserOrgItem({
 *    model:      user_model | organization_model,
 *    vis:        vis_model,
 *    permission: permission_model
 *  });
 *
 */

cdb.admin.UserListItem = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .switch':    'toggleReadOnly',
    'click .canwrite':    'toggleWrite'
  },

  initialize: function() {
    this.vis = this.options.vis;
    this.permission = this.options.permission;
    this.template = cdb.templates.getTemplate( this.options.template || 'common/views/privacy_dialog/user_list_item_view' );
    this._initBinds();
  },

  render: function() {
    var d = this.model.attributes;
    this.$el.html(this.template({
      avatar_url: d.avatar_url,
      username: d.username,
      hasPermissions: this.options.hasPermissions
    }));
    this._switchFields();
    return this;
  },

  _initBinds: function() {
    this.permission.acl.bind('add remove reset change',  this._switchFields, this);
    this.add_related_model(this.permission);
  },

  toggleReadOnly: function(e) {
    this.killEvent(e);
    var perm = this.permission.getPermission(this.model);
    if (perm === "rw" || perm === "r") {
      this.permission.removePermission(this.model);
    } else {
      this.permission.setPermission(this.model, 'r');
    }
  },

  toggleWrite: function(e) {
    this.killEvent(e);
    var perms = this.permission.getPermission(this.model);
    var org_privacy = this.vis.get('privacy').toLowerCase() === "organization";

    if (perms) {
      this.permission.setPermission(this.model, ( perms !== 'rw' ? 'rw' : 'r' ));  
    } else {
      // If vis doesn't have organization type
      if (!org_privacy)
        this.permission.setPermission(this.model, 'rw');
    }
  },

  _switchFields: function() {
    var $switch = this.$('.switch');
    var $canwrite = this.$('.canwrite');
    var $info = this.$('.info');
    var perms = this.permission.getPermission(this.model);
    var org_privacy = this.vis.get('privacy').toLowerCase() === "organization";

    // Reset elements classes
    $canwrite.removeClass('disabled enabled');
    $switch.removeClass('disabled enabled');

    if (perms && perms !== 'n') {
      $switch.addClass('enabled');
      $canwrite.addClass( perms === 'rw' ? 'enabled' : '' );
      $info.removeClass('disabled');
    } else {
      $canwrite.addClass( !org_privacy ? '' : 'disabled' );
      $switch.addClass('disabled');
      $info[ !org_privacy ? 'removeClass' : 'addClass' ]('disabled');
    }
  }

});



/**
 *  Renders a org item and manage their permissions
 *  modifying acl in permissions object.
 *
 *  - It needs:
 *    · A organization model
 *    · A visualization model.
 *    · A permission model.
 *  
 *  new cdb.admin.UserOrgItem({
 *    model:      organization_model,
 *    vis:        vis_model,
 *    permission: permission_model
 *  });
 *
 */

cdb.admin.OrgListItem = cdb.admin.UserListItem.extend({

  toggleReadOnly: function(e) {
    var self = this;
    this.killEvent(e);
    var perm = this.permission.getPermission(this.model);
    // If all users have read permission,
    if ( perm === "r" || perm === "rw" ) {
      this.permission.removePermission(this.model);
    } else {
      this.permission.setPermission(this.model, "r");
    }
  },

  toggleWrite: function(e) {
    var self = this;
    this.killEvent(e);
    
    var perm = this.permission.getPermission(this.model);
    var total_users = this.model.users.size();
    var write_users = this.model.users.find(function(m) { self.permission.getPermission(m) === "rw" });

    // If all users have write permission,
    if ( perm === "rw" ) {
      this.permission.setPermission(this.model, "r");
    } else {
      this.permission.setPermission(this.model, "rw");
    }
  }

});
