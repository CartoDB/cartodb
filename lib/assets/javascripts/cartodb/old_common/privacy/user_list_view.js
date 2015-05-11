
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

  tagName: 'div',
  className: 'org_users_wrapper',

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
    // Clean old stuff if it is necessary
    this.clearSubViews();
    this._destroyScroll();

    this.$el.empty();

    // Create list first
    this.$el.append($('<ul>'));

    // Render organization switches
    this._renderOrganization();

    // Organization users
    this.organization.users.each(this._renderUser.bind(this));

    // Render white gradients for scrolled list
    if (this.organization.users.size() > 3) {
      this._renderScroll();
    }

    return this;
  },

  _destroyScroll: function() {
    var isScrollApplied = this.$el.hasClass('scrollpane');

    if (isScrollApplied && this.$el.data() !== null) {
      this.$('ul').data().jsp && this.$('ul').data().jsp.destroy();
      this.$el.removeClass('scrollpane');
      this.$('ul').removeClass('scrollpane');
    }
  },

  _renderScroll: function() {
    var self = this;

    // Add scrollpane class to the element
      self.$el.addClass('scrollpane');

    // Apply jscrollpane
    setTimeout(function() {
      // jScrollPane
      self.$('ul')
        .addClass('scrollpane')
        .jScrollPane({ verticalDragMinHeight: 20 });

      // Gradients
      var gradients = new cdb.common.ScrollPaneGradient({
        list: self.$('.scrollpane')
      });
      self.$el.append(gradients.render().el);
      self.addView(gradients);
    }, 0);
  },

  _renderUser: function(u) {
    var self = this;
    var v = new cdb.admin.UserListItem({
      model:      u,
      permission: this.permission,
      vis:        this.model,
      hasPermissions: true,
      writePermissionEnabled: this.options.writePermissionEnabled
    });
    this._userViews[u.cid] = v;
    this.addView(v);
    this.$('ul').append(v.render().el);
  },

  _renderOrganization: function() {
    var self = this;
    var v = new cdb.admin.OrgListItem({
      model:          this.organization,
      permission:     this.permission,
      vis:            this.model,
      template:       'old_common/views/privacy_dialog/user_list_all',
      hasPermissions: true,
      writePermissionEnabled: this.options.writePermissionEnabled
    });
    this.addView(v);
    this.$('ul').append(v.render().el);
  },

  _initBinds: function() {
    this.model.bind('change:privacy', this.render, this);

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
    this.template = cdb.templates.getTemplate( this.options.template || 'old_common/views/privacy_dialog/user_list_item_view' );
    if (this.options.writePermissionEnabled !== undefined) {
      this.writePermissionEnabled = this.options.writePermissionEnabled;
    } else {
      this.writePermissionEnabled = true;
    }
    this._initBinds();
  },

  render: function() {
    this._destroyTooltip();

    var d = this.model.attributes;
    this.$el.html(this.template({
      avatar_url: d.avatar_url,
      username: d.username,
      hasPermissions: this.options.hasPermissions,
      writePermissionEnabled: this.writePermissionEnabled
    }));
    this._switchFields();

    if (!this.options.hasPermissions) {
      this._createTooltip();
    }

    return this;
  },

  _createTooltip: function() {
    if (this.$("div.info[original-title]").length > 0) {
      this.$('div.info[original-title]').tipsy({
        fade:     true,
        gravity:  's',
        title:    function() {
          return $(this).attr('original-title')
        }
      });
    }
  },

  _destroyTooltip: function() {
    if (this.$("div.info[data-tipsy]").length > 0) {
      this.$("div.info")
        .unbind('mouseenter mouseleave')
        .tipsy('remove');
    }
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
      if (this.options.hasPermissions) {
        $info.removeClass('disabled');
      }
    } else {
      $canwrite.addClass( !org_privacy ? '' : 'disabled' );
      $switch.addClass('disabled');
      $info[ !org_privacy && this.options.hasPermissions ? 'removeClass' : 'addClass' ]('disabled');
    }
  },

  clean: function() {
    this._destroyTooltip();
    cdb.core.View.prototype.clean.call(this);
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
