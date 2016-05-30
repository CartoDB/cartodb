var _ = require('underscore');
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
   * Creates an anonymous view to render a list of views as one.
   * Useful when wanting to interact with other components that requires a single view as content.
   *
   * @example
   *   var createViewList = [
   *     function() { return new HeaderView({…}); },
   *     function() { return new ItemsView({…}); },
   *     function() { return new FooterView({…}); }
   *   ]
   *   viewFactory.createListView(createViewList, {className: 'jsdoc-example'})
   *
   * @param {Array} fns - list of functions, each which should return a view representing an item in the list
   * @param {Object} viewOpts
   * @return {Object} A view
   */
  createListView: function (createViewFns, viewOpts) {
    if (!(createViewFns && createViewFns.forEach)) throw new Error('createViewFns is required as an iterable list');
    if (!_.all(createViewFns, _.isFunction)) throw new Error('createViewFns must only contain functions');

    var listView = new cdb.core.View(viewOpts);

    listView.render = function () {
      this.clearSubViews();

      createViewFns.forEach(function (createItemView) {
        var view = createItemView();
        this.addView(view);
        this.$el.append(view.render().el);
      }, this);

      return this;
    };

    return listView;
  }
};
