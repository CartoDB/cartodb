
/**
 * this class allows to have a menu where you can add new views as modules
 *
 * each view should have a method or a property to get buttonClass
 */


(function() {

  var Button = cdb.core.View.extend({

    tagName: 'a',

    events: {
      'click': 'click'
    },

    initialize: function() {
      _.bindAll(this, 'click');
      this.elder('initialize');
      this.enabled = true;
    },

    render: function() {
      this.$el.addClass(this.className);
      this.$el.append(this.className);
      this.$el.attr("href", "#" + this.className);
      this.$el.append($('<span>').addClass("error"));
      // Add tipsy
      this.$el.tipsy({
        gravity: "e",
        fade: true,
        offset: -10,
        title: function() {
          return $(this).attr("class").replace("_mod", "").replace(/_/g," ").replace("selected", "")
        }
      });

      return this;
    },

    /**
     * Add a css class to the button, to preserve modularity
     * @param {srting} className
     */
    addClass: function(className) {
      this.$el.addClass(className);
    },

    /**
     * Removes a css class from the button
     * @param  {string} className
     */
    removeClass: function(className) {
      this.$el.removeClass(className);
    },

    enable: function(b) {
      this.enabled = b;
      if(b) {
        this.$el.removeClass('disabled');
      } else {
        this.$el.addClass('disabled');
      }
    },

    click: function(e) {
      this.killEvent(e);
      this.$el.tipsy("hide");
      if(this.enabled)
        this.trigger('click', this.className);
      return false;
    }
  });

  cdb.admin.RightMenu = cdb.core.View.extend({

    tagName: 'section',
    className: 'table_panel',
    animation_time: 300,

    initialize: function() {
      this.panels = new cdb.ui.common.TabPane();
      this.tabs = new cdb.admin.Tabs();
      this.buttons = [];
      this.addView(this.panels);
      this.template = this.getTemplate('table/views/right_panel');
      this.isOpen = true;
    },

    render: function() {
      this.$el.append(this.template({}));
      this.panels.setElement(this.$('.views'));
      this.tabs.setElement(this.$('.sidebar'));
      return this;
    },

    addToolButton: function(type, sections) {
      var b = this._addButton(type, sections);
      buttons = this.$('.edit');
      buttons.append(b.render().$el);
      return b;
    },

    _addButton: function(type, sections) {
      var b = new Button();
      b.className = type;
      b.sections = _.isArray(sections) ? sections: [sections];
      this.addView(b);

      this.buttons.push(b);
      b.$el.css({ display: 'block'});
      if(this.activeSection) {
        if(!_.include(b.sections, this.activeSection)) {
          b.hide();
        }
      }
      return b;
    },

    /**
     * Add a css class to a button
     * @param {String} buttonType
     * @param {String} className
     */
    addClassToButton: function(buttonType, className) {
      var button = this.getButtonByClass(buttonType);
      if (button)
        button.addClass(className);
    },
    /**
     * Remove a css class from a button
     * @param {String} buttonType
     * @param {String} className
     */
    removeClassFromButton: function(buttonType, className) {
      var button = this.getButtonByClass(buttonType);
      if (button)
        button.removeClass(className);
    },


    addModule: function(v, sections) {
      sections = sections || ['table'];
      this.panels.addTab(v.buttonClass, v);

      var b = this._addButton(v.buttonClass, sections);

      var buttons = this.$('.tools');
      buttons.append(b.render().$el);

      // check if should be enabled
      if(this.activeSection) {
        if(!_.include(b.sections, this.activeSection)) {
          b.hide();
        }
      }

      // call togle before activate panel
      b.bind('click', this.toggle, this);
      b.bind('click', this.panels.active, this.panels);
    },

    active: function(modName) {
      this.panels.active(modName);
    },

    showTools: function(section, notHide) {
      notHide = notHide? notHide : false;
      this.activeSection = section;
      if(!notHide) {
        this.hide();
      }
      _(this.buttons).each(function(b) {
        if(_.include(b.sections, section)) {
          b.show();
        } else {
          b.hide();
        }
      });
    },

    disableModule: function(name) {
      var button = this.getButtonByClass(name);
      if(button) {
        button.enable(false);
        var p = this.panels.getPane(name);
        if(p && p.disabled) {
          p.disabled();
        }
      }
    },

    enableModule: function(name) {
      var button = this.getButtonByClass(name);
      if(button) {
        button.enable(true);
        var p = this.panels.getPane(name);
        if(p && p.enabled) {
          p.enabled();
        }
      }
    },

    toggle: function(modName) {
      // only hide if we click on active tab
      if(this.isOpen && modName == this.panels.activeTab) {
        this.hide(modName);
      } else {
        this.show(modName);
      }
    },


    hide: function(modName) {
      var panel_width = this.$el.width();

      // Hide the tab
      this.tabs.desactivate(modName);

      // Hide panel -> trigger
      cdb.god.trigger("panel_action", "hide");

      this.isOpen = false;
      this.$el.animate({
        right: 63 - panel_width
      }, this.animation_time);
    },


    changeWithin: function(type) {
      var width = 450
        , action = 'narrowPanel';

      if (type == "carto") {
        width = 600;
        action = 'showPanel';
      }

      cdb.god.trigger('panel_action', action);

      this.$el.animate({
        width: width,
        right: 0
      }, this.animation_time);
    },


    show: function(modName, subName) {
      var self = this;
      var width = 600
        , action = 'show';

      // Select the tab
      this.tabs.activate(modName);
      this.panels.active(modName);

      switch (modName) {
        case 'filters_mod':
        case 'wizards_mod':
        case 'infowindow_mod':
          width = 450;
          action = 'narrow';
          break;
        default:
      }

      // Show panel -> trigger
      cdb.god.trigger('panel_action', action);

      this.isOpen = true;
      this.$el.animate({
        width: width,
        right: 0
      }, { duration: this.animation_time, complete: function() {
        self.trigger("end_" + action); // inform subscribers that the animation is finished
      }});
    },

    /**
    * Return the menu button whose class is the received className
    * @method getButtonByClass
    * @param className {String}
    * @returns Button
    */
    getButtonByClass: function(className) {
      for(var i = 0, l = this.buttons.length; i < l; i++) {
        if(this.buttons[i].className === className) {
          return this.buttons[i]
        }
      }
      return null;
    }


  });

})();
