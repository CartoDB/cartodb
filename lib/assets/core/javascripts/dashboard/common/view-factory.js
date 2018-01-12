var _ = require('underscore');
var CoreView = require('backbone/core-view');

/**
 * Convenient factory to create views without having to create new files.
 */

// TODO: Dialogs

module.exports = {

  /**
   * @return {Object} instance of cdb.core.View, which takes two params of template and templateData
   */
  createByTemplate: function (template, templateData, viewOpts) {
    var view = new CoreView(viewOpts);
    view.render = function () {
      this.$el.html(
        template(templateData)
      );
      return this;
    };

    return view;
  },

  /**
   * Creates a view that holds a list of views to be rendered.
   * @param {Array} list of View object, i.e. have a render method, $el, and clean method.
   * @param {Object,undefined} viewOpts view options, .e.g {className: 'Whatever'}
   * @return {Object} A view
   */
  createByList: function (views, viewOpts) {
    var listView = new CoreView(viewOpts);
    listView.render = function () {
      this.clearSubViews();
      _.each(views, function (view) {
        this.addView(view);
        this.$el.append(view.render().$el);
      }, this);
      return this;
    };
    return listView;
  }
};
