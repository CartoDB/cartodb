const _ = require('underscore');
const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({

  initialize: function () {
    this.tabs = {};
    this.activeTab = null;
    this.activePane = null;
  },

  addTab: function (name, view, options) {
    options = options || { active: true };
    if (this.tabs[name] !== undefined) {
      console.debug(name + 'already added');
    } else {
      this.tabs[name] = view.cid;
      this.addView(view);
      if (options.after !== undefined) {
        var e = this.$el.children()[options.after];
        view.$el.insertAfter(e);
      } else if (options.prepend) {
        this.$el.prepend(view.el);
      } else {
        this.$el.append(view.el);
      }
      this.trigger('tabAdded', name, view);
      if (options.active) {
        this.active(name);
      } else {
        view.hide();
      }
    }
  },

  getPreviousPane: function () {
    var tabs = _.toArray(this.tabs);
    var panes = _.toArray(this._subviews);

    var i = _.indexOf(tabs, this.activePane.cid) - 1;
    if (i < 0) i = panes.length - 1;

    return panes[i];
  },

  getNextPane: function () {
    var tabs = _.toArray(this.tabs);
    var panes = _.toArray(this._subviews);

    var i = 1 + _.indexOf(tabs, this.activePane.cid);
    if (i > panes.length - 1) i = 0;

    return panes[i];
  },

  getPane: function (name) {
    var vid = this.tabs[name];
    return this._subviews[vid];
  },

  getActivePane: function () {
    return this.activePane;
  },

  size: function () {
    return _.size(this.tabs);
  },

  clean: function () {
    this.removeTabs();
    CoreView.prototype.clean.call(this);
  },

  removeTab: function (name) {
    if (this.tabs[name] !== undefined) {
      var vid = this.tabs[name];
      this._subviews[vid].clean();
      delete this.tabs[name];

      if (this.activeTab == name) { // eslint-disable-line eqeqeq
        this.activeTab = null;
      }

      if (_.size(this.tabs)) {
        this.active(_.keys(this.tabs)[0]);
      }
    }
  },

  removeTabs: function () {
    for (var name in this.tabs) {
      var vid = this.tabs[name];
      this._subviews[vid].clean();
      delete this.tabs[name];
    }
    this.activeTab = null;
  },

  active: function (name) {
    const vid = this.tabs[name];

    if (vid !== undefined) {
      if (this.activeTab !== name) {
        var v = this._subviews[vid];

        if (this.activeTab) {
          var vid_old = this._subviews[this.tabs[this.activeTab]];

          vid_old.hide();
          this.trigger('tabDisabled', this.activeTab, vid_old);
          this.trigger('tabDisabled:' + this.activeTab, vid_old);
          if (vid_old.deactivated) {
            vid_old.deactivated();
          }
        }

        v.show();
        if (v.activated) {
          v.activated();
        }

        this.activeTab = name;
        this.activePane = v;

        this.trigger('tabEnabled', name, v);
        this.trigger('tabEnabled:' + name, v);
      }

      return this.activePane;
    }
  },

  render: function () {
    return this;
  },

  each: function (fn) {
    _.each(this.tabs, (cid, tab) => {
      fn(tab, this.getPane(tab));
    });
  }

});
