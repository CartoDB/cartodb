var Browser = require("zombie");
var assert  = require("assert");
var util    = require('util');

// Load the page from localhost
browser = new Browser({
  debug : true,
  runScripts : true,
  waitFor : 0,
  
  userAgent : 'Mozilla/5.0 (Ubuntu; X11; Linux i686; rv:9.0) Gecko/20100101 Firefox/9.0'
});
  
browser.visit("http://toktest.localhost.lan:3000/", function () {
  browser.dump();
  console.log(util.inspect(browser.lastResponse.headers));
  console.log(browser.cookies().all())
  
  // Fill email, password and submit form
  browser.
    fill("email", "toktest").
    fill("password", "toktest").
    pressButton("Log in", function() {

      // Form submitted, new page loaded.
      browser.dump();
      console.log(browser.cookies().all())
    });
});