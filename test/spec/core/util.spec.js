describe("util", function() {
  it("should identify user agents properly", function() {
  	var browser, ua;
	ua = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.chrome).not.toEqual("undefined");

	ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A";
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.safari).not.toEqual("undefined");

	ua = "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16";
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.opera).not.toEqual("undefined");

	ua = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko";
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.ie).not.toEqual("undefined");

	ua = "Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0";
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.firefox).not.toEqual("undefined");

	ua = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136"
  	browser = cdb.core.util._inferBrowser(ua);
  	expect(typeof browser.edge).not.toEqual("undefined");

  });
});
