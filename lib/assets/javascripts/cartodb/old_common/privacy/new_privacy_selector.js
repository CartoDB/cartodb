
  /**
   *  Privacy selector with several possibilities
   *  
   *  - Public
   *  - With link
   *  - Password protected
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
        description:  _t('All people can view it.'),
        error:        _t(''),
        limitation:   false
      },
      {
        type:         'LINK',
        title:        _t('Only people with the link'),
        description:  _t('Only visible to people with the link.'),
        error:        _t('Enabled for paid accounts.'),
        limitation:   'private'
      },
      {
        type:         'PASSWORD',
        title:        _t('Password protected'),
        description:  _t('Only people with password can view this.'),
        error:        _t('Only for visualizations and paid accounts.'),
        limitation:   'private_maps'
      },
      // {
      //   type:         'ORGANIZATION',
      //   title:        _t('Shared within your organization'),
      //   description:  _t('Selected people can view and edit this.'),
      //   error:        _t('Only enabled for enterprise accounts.'),
      //   limitation:   'organization'
      // },
      {
        type:         'PRIVATE',
        title:        _t('Private'),
        description:  _t('This is only accessible by yourself.'),
        error:        _t('Enabled for paid accounts.'),
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
        source: this.options.source,
        upgrade_url: this.options.upgrade_url,
        collection: this.collection
      });
      this.list.bind('onSelect', this.hideList, this);
      this.$el.append(this.list.render().el);
      this.addView(this.list);
    },

    _initBinds: function() {
      this.model.bind('change:privacy', this.render, this);
    },

    _destroyBinds: function() {},

    showList: function() {
      this.list
        .render()
        .show();
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

        // Private tables
        if (m.get('limitation') === 'private' && !this.user.get('actions').private_tables) {
          isEnabled = false;
        }

        // Private maps
        if (m.get('limitation') === 'private_maps' && ( !this.user.get('actions').private_maps || !this.model.get('isVisualization') ) ) {
          isEnabled = false;
        }

        // // Organization?
        // if (m.get('limitation') === 'organization' && !this.user.isInsideOrg()) {
        //   isEnabled = false;
        // }
      }

      // tables does not have share with password
      if (m.get('limitation') === 'private_maps' && !this.model.get('isVisualization')) {
        return;
      }

      var item = new cdb.admin.VisPrivacySelectorItem({
        model:            m,
        is_visualization: this.model.get("isVisualization"),
        upgrade_url:      this.options.upgrade_url,
        enabled:          isEnabled,
        source:           this.options.source,
        selected:         this.model.get('privacy').toLowerCase() === m.get('type').toLowerCase()
      });

      item.bind('privacyChanged', this._onChangePrivacy, this);
      this.$el.append(item.render().el);
      this.addView(item);
    },

    _onChangePrivacy: function(privacy) {
      this.trigger('onSelect', this);
      this.model.set('privacy',privacy);
    }

  });



  // Privacy item for list
  cdb.admin.VisPrivacySelectorItem = cdb.core.View.extend({

    tagName: 'li',
    className: 'privacy-item',

    events: {
      'click a.upgrade':  '_onUpgradeClick',
      'click':            '_onClick'
    },

    initialize: function() {
      _.bindAll(this, '_onClick', '_onUpgradeClick');
      this.template = cdb.templates.getTemplate('old_common/views/privacy_dialog/vis_privacy_selector_item');
    },

    render: function() {
      var obj = {
        type:         this.model.get('type'),
        selected:     this.options.selected,
        enabled:      this.options.enabled,
        title:        this.model.get('title'),
        description:  this.model.get('description'),
        error:        this.model.get('error'),
        organization: this.model.get('organization')
      };

      this.$el.html(this.template(obj));
      return this;
    },

    _onUpgradeClick: function(e) {
      this.killEvent(e);

      var isVisualization = this.model.get('isVisualization');

      var kind         = this.options.is_visualization ? "Visualization" : "Table";

      var utm_source   = "Trying_Marking_" + kind + "_Private";
      var source       = this.options.source || kind;
      var utm_campaign = "Upgrade_from_" + (source.charAt(0).toUpperCase() + source.slice(1));
      var utm_content  = this.model.get("type");

      var url = this.options.upgrade_url + "?utm_source=" + utm_source + "&utm_medium=referral&utm_campaign=" + utm_campaign + "&utm_content=" + utm_content;

      window.location = url;

    },

    _onClick: function(e) {
      this.killEvent(e);
      if (this.options.enabled)
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

      var obj = {
        type:         list[0].get('type'),
        selected:     false,
        enabled:      true,
        title:        list[0].get('title'),
        description:  list[0].get('description'),
        error:        list[0].get('error'),
        organization: list[0].get('organization')
      };

      this.$el.html(this.template(obj));
      return this;
    },

    _onClick: function(e) {
      this.killEvent(e);
      this.trigger('showList', this);
    }

  });

