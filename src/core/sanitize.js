var htmlCssSanitizer = require('html-css-sanitizer');

/**
 * Sanitize inputHtml of unsafe HTML tags & attributes
 * @param {String} inputHtml
 * @param {Function,false,null,undefined} optionalSanitizer By default undefined, for which the default sanitizer will be used.
 *   Pass a function (that takes inputHtml) to sanitize yourself, or false/null to skip sanitize call.
 */
htmlCssSanitizer.html = function(inputHtml, optionalSanitizer) {
  if (!inputHtml) return;

  if (optionalSanitizer === undefined) {
    return htmlCssSanitizer.sanitize(inputHtml, function(url) {
      // Return all URLs for <a href=""> (javascript: and data: URLs are removed prior to this fn is called)
      return url;
    });
  } else if (typeof optionalSanitizer === 'function') {
    return optionalSanitizer(inputHtml);
  } else { // alt sanitization set to false/null/other, treat as if caller takes responsibility to sanitize output
    return inputHtml;
  }
}

module.exports = htmlCssSanitizer;
