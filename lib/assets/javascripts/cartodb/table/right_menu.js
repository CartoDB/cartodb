
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

    render: function() {
      this.$el.addClass(this.className);
      this.$el.append(this.className);
      this.$el.attr("href", "#" + this.className);
      return this;
    },

    click: function(e) {
      e.preventDefault();
      this.trigger('click', this.className);
      return false;
    }

  });

  cdb.admin.RightMenu = cdb.core.View.extend({

    tagName: 'section',
    className: 'table_panel',

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

    addModule: function(v, sections) {
      sections = sections || ['table'];
      this.panels.addTab(v.buttonClass, v);
      var buttons;
      if(v.type == 'tool') {
        buttons = this.$('.tools');
      } else {
        buttons = this.$('.edit');
      }
      var b = new Button();
      b.className = v.buttonClass;
      b.sections = _.isArray(sections) ? sections: [sections];
      buttons.append(b.render().$el.css({ display: 'block'}));
      this.addView(b);
      this.buttons.push(b);

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

    showTools: function(section) {
      this.activeSection = section;
      this.hide();
      _(this.buttons).each(function(b) {
        if(_.include(b.sections, section)) {
          b.show();
        } else {
          b.hide();
        }
      });
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
      // Hide the tab
      this.tabs.desactivate(modName);

      // Hide panel -> trigger
      cdb.god.trigger("hidePanel");

      this.isOpen = false;
      this.$el.animate({
        right: -535
      });
    },

    show: function(modName) {
      // Select the tab
      this.tabs.activate(modName);

      // Show panel -> trigger
      cdb.god.trigger("showPanel");

      this.isOpen = true;
      this.$el.animate({
        right: 0
      });
    }

  });

})();
