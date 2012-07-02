
/**
 * tabbed pane.
 * if contains n views inside it and shows only one at once
 *
 * usage:
 *
 * var pane = new cbd.ui.common.TabPane();
 * pane.addTab('tab1', new OtherView());
 * pane.addTab('tab2', new OtherView2());
 * pane.addTab('tab3', new OtherView3());
 * 
 * pane.active('tab1');
 *
 * pane.bind('tabEnabled', function(tabName, tabView) {
 * pane.bind('tabDisabled', function(tabName, tabView) {
 * });
 */
cdb.ui.common.TabPane = cdb.core.View.extend({

  initialize: function() {
      this.tabs = {};
      this.activeTab = null;
  },

  addTab: function(name, view) {
    if(this.tabs[name] !== undefined) {
      cdb.log.debug(name + "already added");
    } else {
      this.tabs[name] = view.cid;
      this.addView(view);
      this.$el.append(view.el);
      this.active(name);
    }
  },

  removeTab: function(name, view) {
    if(this.tabs[name] === undefined) {
      cdb.log.debug("trying to remove non existing pane " + name);
    } else {
      var vid = this.tabs[name];
      this._subviews[vid].clean();
      delete this.tabs[name];
      //TODO: activate other
      if(_.size(this.tabs)) {
        this.active(_.keys(this.tabs)[0]);
      }
    }
  },

  active: function(name) {
    var self = this;
    var vid = this.tabs[name];
    if(vid === undefined) {
      cdb.log.debug("trying to switch to non existing pane " + name);
    } else {
      if(this.activeTab !== name) {
        var v = this._subviews[vid];
        this.activeTab = name;
        _(this._subviews).each(function(v) {
          if(v.cid === vid) {
            v.show();
            self.trigger('tabEnabled', name, v);
          } else {
            v.hide();
            self.trigger('tabDisabled', '' , v);
          }
        });
      }
    }

  },

  render: function() {
      return this;
  }

});
