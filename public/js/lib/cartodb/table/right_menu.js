
/**
 * this class allows to have a menu where you can add new views as modules
 *
 * each view should have a method or a proerty to get buttonClass
 */


var Button = cdb.core.View.extend({

  tagName: 'a',

  events: {
    'click': 'click'
  },

  render: function() {
    this.$el.addClass(this.className);
    return this;
  },

  click: function(e) {
    e.preventDefault();
    this.trigger('click', this.className);
    return false;
  }

});

cdb.admin.RightMenu = cdb.core.View.extend({

  events: {
    'click .sidebar a': 'buttonClicked'
  },

  className: 'table_panel',

  initialize: function() {
    this.panels = new cdb.ui.common.TabPane();
    this.tabs = new cdb.admin.Tabs();
    this.addView(this.panels);
    this.template = this.getTemplate('table/views/right_panel');
  },

  render: function() {
    this.$el.append(this.template({}));
    this.panels.setElement(this.$('.views'));
    this.tabs.setElement(this.$('.sidebar'));
    return this;
  },

  addModule: function(v) {
    this.panels.addTab(v.buttonClass, v);
    var buttons;
    if(v.type == 'tool') {
      buttons = this.$('.tools')
    } else {
      buttons = this.$('.edit')
    }
    var b = new Button();
    b.className = v.buttonClass;
    buttons.append(b.render().el);
    this.addView(b);
    b.bind('click', this.panels.active, this.panels);
  },

  buttonClicked: function(e) {

  }



});
