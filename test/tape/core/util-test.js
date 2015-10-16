var test = require('tape');
var util = require('cdb.core.util');

test('core/util: should identify user agents properly', function(t) {
  var browser, ua;
  t.plan(7);

	ua = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";
	browser = util._inferBrowser(ua);
  t.ok(browser.chrome, 'identifies Chrome browser');

	ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A";
	browser = util._inferBrowser(ua);
  t.ok(browser.safari, 'identifies Safari browser');

	ua = "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16";
	browser = util._inferBrowser(ua);
  t.ok(browser.opera, 'identifies Opera browser');

	ua = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko";
  global.document = {
    compatMode: true,
    querySelector: true,
    addEventListener: true,
    all: false
  }
  global.window = {
    XMLHttpRequest: true,
    atob: true
  }
	browser = util._inferBrowser(ua);
  t.ok(browser.ie, 'identifies IE browser');
  t.equals(browser.ie.version, 11, 'identifies the default version of IE');

	ua = "Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0";
	browser = util._inferBrowser(ua);
  t.ok(browser.firefox, 'identifies FireFox browser');

	ua = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136"
	browser = util._inferBrowser(ua);
  t.ok(browser.edge, 'identifies "Edge" browser');
});
