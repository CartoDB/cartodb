module.exports = function (xhr, textStatus, errorThrown) {
  console.log('403 Forbidden interceptor', arguments);

  if (xhr.status === 403) {
    console.log('redirect to login');
  }
};
