
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
      this.$el.attr("href", "#" + this.className).text(this.className.replace("_mod", "").replace(/_/g," ").replace("selected", ""));
      this.$el.append($('<span>').addClass("error"));
      this.$el.append($('<span>').addClass("run"));

      return this;
    },

    show: function() {
      this.$el.css('display', 'block');
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
      if (e) e.preventDefault();
      if(this.enabled)
        this.trigger('click', this.className);
      return false;
    }
  });

  cdb.admin.RightMenu = cdb.core.View.extend({

    tagName: 'section',

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
      this.panels.setElement(this.$('.layer-views'));
      this.tabs.setElement(this.$('.layer-sidebar'));
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
      b.show();
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
      this.tabs.activate(modName);
    },

    showTools: function(section) {
      this.activeSection = section;
      _(this.buttons).each(function(b) {
        if(_.include(b.sections, section)) {
          b.show();
        } else {
          b.hide();
        }
      });
    },

    enabledButtonsForSection: function(section) {
      return _(this.buttons).filter(function(b) {
        return _.include(b.sections, section);
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
      this.trigger('toggle', modName);
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
