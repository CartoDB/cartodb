var _ = require('underscore');
var cdb = require('cartodb.js');
var loadingTemplate = require('./loading.tpl');
var LoadingModel = require('./loading-model');

/**
 * Display a loading view in case some predicate is not passing yet
 *
 * Example usage with raw values:
 *   var isReady = false;
 *   var view = new LoadingView({
 *     title: 'Loading something',
 *     predicate: function() {
 *       return isReady;
 *     },
 *     createContentView: function (opts) {
 *       return new SomeContentView({
 *         el: opts.el,
 *         model: foobarModel
 *       })
 *     }
 *   });
 *   setTimeout(function() { isReady = true; }, 1000);
 *
 * Example usage with using a custom model:
 *   var customModel = cdb.core.Model({
 *     title: 'Loading done already',
 *     desc: 'Always ready (only really to illustrate this example)',
 *     predicate: function() {
 *       return true;
 *     },
 *     createContentView: function (opts) {
 *       return new SomeContentView({
 *         el: opts.el,
 *         model: foobarModel
 *       })
 *     }
 *   })
 *   var view = new LoadingView({
 *     model = customModel
 *   })
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!this.model) {
      this.model = new LoadingModel(_.omit(opts, 'el'));
    }
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.clearSubViews();

    if (this.model.isReady()) {
      var view = this.model.createContentView({
        el: this.el
      });
      view.render();
      this.addView(view);
    } else {
      this.$el.html(
        loadingTemplate({
          title: this.model.get('title'),
          desc: this.model.get('desc')
        })
      );
    }

    return this;
  }
});
