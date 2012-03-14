var Browser = require("zombie");
var assert = require("assert");

// Load the page from localhost
browser = new Browser()
browser.visit("http://toktest.localhost.lan:3000/", function () {

  // Fill email, password and submit form
  browser.
    fill("email", "toktest").
    fill("password", "toktest").
    pressButton("Log in", function() {

      // Form submitted, new page loaded.
      //assert.equal(browser.location.pathname, "/sessions/create");
      console.log(browser.dump());
      //assert.equal(browser.text("title"), "Welcome To Brains Depot");

    });

});