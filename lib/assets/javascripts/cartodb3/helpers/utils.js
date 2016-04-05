/*
 *  Util functions
 */

module.exports = {
  /*
   *  Simple regex to check if string is an url/ftp
   *  input ->  string with input text (example: 'http://cartodb.com')
   *
   *  return -> true
   */
  isURL: function (input) {
    var urlregex = /^((http|https|ftp)\:\/\/)/g;
    if (input) {
      return urlregex.test(input);
    } else {
      return false;
    }
  }
};
