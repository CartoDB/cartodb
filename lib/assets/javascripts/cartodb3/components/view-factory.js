var cdb = require('cartodb.js');

/**
 * Convenient factory to create views without having to create new files.
 */
module.exports = {

  /**
   * @param {String} html e.g. '<div>whatever</div>'
   * @param {Object,undefined} viewOpts view options, .e.g {className: 'Whatever'}
   * @return {Object} instance of cdb.core.View, which takes two params of template and templateData
   */
  createByHTML: function (html, viewOpts) {
    var view = new cdb.core.View(viewOpts);
    view.render = function () {
      this.$el.html(html);
      return this;
    };

    return view;
  },

  /**
   * @param {Function} template e.g. from a `require('./my-template.tpl')`
   * @param {Object,undefined} templatedata
   * @param {Object,undefined} viewOpts view options, .e.g {className: 'Whatever'}
   * @return {Object} instance of cdb.core.View, which takes two params of template and templateData
   */
  createByTemplate: function (template, templateData, viewOpts) {
    var view = new cdb.core.View(viewOpts);
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
    var listView = new cdb.core.View(viewOpts);
    listView.render = function () {
      this.clearSubViews();
      views.forEach(function (view) {
        this.addView(view);
        this.$el.append(view.render().$el);
      }, this);
      return this;
    };
    return listView;
  }
};
