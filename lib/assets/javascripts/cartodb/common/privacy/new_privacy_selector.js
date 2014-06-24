
  /**
   *  Privacy selector with several possibilities
   *  
   *  - Public
   *  - With link
   *  - Password protected
   *  - Shared within your organization
   *  - Private
   *
   *  - Needed: 
   *    · Visualization model
   *    · User model
   *
   */


  cdb.admin.VisPrivacySelector = cdb.core.View.extend({

    _TYPES: [
      {
        type:         'PUBLIC',
        title:        _t('Public'),
        description:  _t('All people can view this table'),
        limitation:   false
      },
      {
        type:         'LINK',
        title:        _t('Only people with the link'),
        description:  _t('Only visible to people with the link'),
        limitation:   'private'
      },
      {
        type:         'PASSWORD',
        title:        _t('Password protected'),
        description:  _t('Only people with password can view this'),
        limitation:   'private'
      },
      {
        type:         'ORGANIZATION',
        title:        _t('Shared within your organization'),
        description:  _t('Selected people can view and edit this'),
        limitation:   'organization'
      },
      {
        type:         'PRIVATE',
        title:        _t('Private'),
        description:  _t('This is only accesible by yourself'),
        limitation:   'private'
      }
    ],

    initialize: function() {
      this.collection = new Backbone.Collection(this._TYPES);
      this.user = this.options.user;
      this._initViews();
      this._initBinds();
    },

    render: function() {
      // Change current one
      this.selected.render();

      // Hide list in any case
      this.list.hide();

      return this;
    },

    _initViews: function() {
      this.selected = new cdb.admin.VisPrivacySelectorCurrent({
        model: this.model,
        user: this.user,
        collection: this.collection
      });
      this.$el.append(this.selected.render().el);
      this.selected.bind('showList', this.showList, this);
      this.addView(this.selected);

      this.list = new cdb.admin.VisPrivacySelectorList({
        model: this.model,
        user: this.user,
        collection: this.collection
      });
      this.$el.append(this.list.render().el);
      this.addView(this.list);
    },

    _initBinds: function() {
      this.model.bind('change:privacy', this.render, this);
    },

    _destroyBinds: function() {},

    showList: function() {
      this.list.show();
    },

    hideList: function() {
      this.list.hide();
    }

  });



  /**
   *  Available privacy list
   *
   *
   */

  cdb.admin.VisPrivacySelectorList = cdb.core.View.extend({

    tagName: 'ul',
    className: 'privacy-list',

    initialize: function() {
      _.bindAll(this, '_addPrivacyItem');
      this.user = this.options.user;
    },

    render: function() {
      this.clearSubViews();
      this.collection.each(this._addPrivacyItem);
      return this;
    },

    _addPrivacyItem: function(m) {
      var isEnabled = true;

      // Check if user can enabled this privacy status
      if (m.get('limitation')) {
        if (m.get('limitation') === 'private' && this.user.get('actions') && !this.user.get('actions').private_tables) {
          isEnabled = false;
        }

        if (m.get('limitation') === 'organization' && !this.user.organization) {
          isEnabled = false;
        }
      }

      var item = new cdb.admin.VisPrivacySelectorItem({
        model:    m,
        enabled:  isEnabled
      });

      item.bind('privacyChanged', this._onChangePrivacy, this);
      this.$el.append(item.render().el);
      this.addView(item);
    },

    _onChangePrivacy: function(privacy) {
      this.model.set('privacy',privacy);
    }

  });



  // Privacy item for list
  cdb.admin.VisPrivacySelectorItem = cdb.core.View.extend({

    tagName: 'li',
    className: 'privacy-item',

    events: {
      'click': '_onClick'
    },

    initialize: function() {
      _.bindAll(this, '_onClick');
      this.template = cdb.templates.getTemplate('common/views/privacy_dialog/vis_privacy_selector_item');
      this.enabled = this.options.enabled;
    },

    render: function() {
      var obj = this.model.attributes;
      obj.enabled = this.enabled;
      this.$el.html(this.template(obj));
      return this;
    },

    _onClick: function(e) {
      this.killEvent(e);
      if (this.enabled)
        this.trigger('privacyChanged', this.model.get('type'), this);
    }

  });



  // Current privacy item
  cdb.admin.VisPrivacySelectorCurrent = cdb.admin.VisPrivacySelectorItem.extend({

    tagName: 'div',
    className: 'privacy-item current-privacy-item',

    render: function() {
      var list = this.collection.where({ type: this.model.get('privacy') });

      if (list.length === 0) cdb.log.info('No privacy type associated with ' + this.model.get('privacy'))

      var obj = list[0].attributes;
      obj.enabled = true;
      this.$el.html(this.template(obj));
      return this;
    },

    _onClick: function(e) {
      this.killEvent(e);
      this.trigger('showList', this);
    }

  });

