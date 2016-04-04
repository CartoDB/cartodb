var $ = require('jquery');

/**
 * Check if Linux user used right/middle click at the time of the event
 *
 * @param ev {Event}
 * @returns {boolean}
 */
function isLinuxMiddleOrRightClick (ev) {
  return ev.which === 2 || ev.which === 3;
}

/**
 * Check if Mac user used CMD key at the time of the event Mac user used CMD key at the time of the event.
 *
 * @param ev {Event}
 * @returns {boolean}
 */
function isMacCmdKeyPressed (ev) {
  return ev.metaKey;
}

function isCtrlKeyPressed (ev) {
  return ev.ctrlKey;
}

/**
 * Click handler for a cartodb.js view, to navigate event target's href URL through the view's router.navigate method.
 *
 * The default behavior is:
 * Unless cmd/ctrl keys are pressed it will cancel the default link behavior and instead navigate to the URL set in the
 * target's href attribute.
 *
 * Prerequisities:
 *  - view has a this.router instance.
 *
 * Example of how to use:
 *   - In a template:
 *     <a href="/some/uri" id="#my-link" ...
 *     <a href="/special/uri" id="#my-special-link" ...
 *
 *   - In the view file:
 *     var navigateThroughRouter = require('../../common/view_helpers/navigateThroughRouter');
 *     module.exports = new cdb.core.View.extend({
 *       events: {
 *         'click a#my-link': navigateThroughRouter
 *         'click a#my-special-link': this._myCustomRoute
 *       }
 *
 *       _myCustomRoute: function(ev) {
 *         // Here you can do you custom logic before/after the routing, e.g.:
 *         console.log('before changing route');
 *         navigateThroughRouter.apply(this, arguments);
 *         console.log('after changing route');
 *       }
 *
 * @param ev {Event}
 */
module.exports = function (ev) {
  // We always kill the default behaviour of the event, since container around view might have other click behavior.
  // In case of a cmd/ctrl click by an user.
  this.killEvent(ev);
  var url = $(ev.target).closest('a').attr('href');

  if (!url) {
    return false;
  }

  if (!isLinuxMiddleOrRightClick(ev) && !isMacCmdKeyPressed(ev)) {
    (this.router || this.options.router).navigate(url, { trigger: true });
  } else if (isCtrlKeyPressed(ev) || isMacCmdKeyPressed(ev)) {
    window.open(url, '_blank');
  }
};
