module.exports = function(str, console) {
  console = console || window.console || {info:function(){}};
  if (console.info) {
    console.info(str);
  }
};
