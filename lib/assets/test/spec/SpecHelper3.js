// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      },
      timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
}());

var spec;
var reporterCurrentSpec = {
  specStarted: function (result) {
    spec = result.fullName;
  }
};

jasmine.getEnv().addReporter(reporterCurrentSpec);

/**
 * Utilities to help the tests
 * @type {Object}
 */
var TestUtil = {};
window.ACTIVE_LOCALE = 'en';

_t = function (attrs) {
  return attrs;
};

TestUtil.config = {
};

TestUtil.linkedObjects = function (view) {
  function flatten_views (view) {
    var flatten = [];
    var sub = view._subviews;
    flatten.push(view);
    for (var k in sub) {
      var v = sub[k];
      flatten.push(v);
      flatten = flatten.concat(flatten_views(v));
    }
    return flatten;
  }
  var views = flatten_views(view);
  view.clean = _.once(view.clean); // eslint-disable-line
  view.clean();

  function evented_objects (obj) {
    var ev = [];
    for (var k in obj) {
      var o = obj[k];
      if (k !== '_parent' && o && obj.hasOwnProperty(k) && o._callbacks) {
        ev.push(o);
      }
    }
    return ev;
  }

  function callback_context (o) {
    var c = [];
    var callbacks = o._callbacks;
    for (var i in callbacks) {
      var node = callbacks[i];
      var end = node.tail;
      while ((node = node.next) !== end) {
        if (node.context) {
          c.push(node.context.cid);
        }
      }
    }
    return c;
  }

  function already_linked () {
    var linked = [];
    // check no pending callbacks
    for (var k in views) {
      var v = views[k];
      var objs = evented_objects(v);
      for (var o in objs) {
        if (_.include(callback_context(objs[o]), v.cid)) {
          linked.push(v);
        }
      }
    }
    return linked;
  }

  return already_linked();
};

TestUtil.assertNotLeaks = function (view) {
  expect(TestUtil.linkedObjects(view).length).toEqual(0);
};

TestUtil._view = function (v) {
  // 1) name of view property in "this" context, e.g. "foobarView"
  // 2) view object as param, e.g. foobarView
  // 3) this.view defined in a beforeEach
  return this[v] || v || this.view;
};

beforeEach(function () {
  jasmine.addMatchers({
    toHaveNoLeaks: function () {
      if (arguments.length > 0) {
        // throw new Error('toHaveNoLeaks not take arguments, use toHaveBeenCalledWith');
      }

      return {
        compare: function (actual, expected) {
          var linked = TestUtil.linkedObjects(actual);
          if (linked.length) {
            console.log('** linked objects');
            for (var i in linked) {
              console.log(linked[i]);
            }
          }
          var result = {};
          result.pass = linked.length === 0;
          result.message = 'Expected objects not linked (' + linked.length + '), check the console';
          return result;
        }
      };
    }
  });

  this.innerHTML = function (v) {
    return TestUtil._view.call(this, v).el.innerHTML;
  };

  this.$html = function (v) {
    return TestUtil._view.call(this, v).$el.html();
  };
});

afterEach(function () {
  if (this.view && this.view.clean) {
    this.view.clean();
  }

  var afterTestResults = false;
  var childNodes = [];

  Array.prototype.slice.call(document.body.children).forEach(function (childNode) {
    if (!afterTestResults && childNode.className === 'jasmine_html-reporter') {
      afterTestResults = true;
    } else if (afterTestResults) {
      childNodes.push(childNode);
    }
  });

  if (childNodes.length > 0) {
    var msg = spec + ': DOM nodes found that should have been removed! By default this.view.clean() is called afterEach test, do you have others?';
    console.warn(msg, childNodes);
    throw new Error(msg + ' See dev console for details');
  }
});
