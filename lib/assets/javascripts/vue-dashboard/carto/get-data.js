const CartoNode = require('carto-node');
const client = new CartoNode.AuthenticatedClient();

export default function () {
  return new Promise((resolve, reject) => {
    client.getConfig(function (err, response, data) {
      if (err) {
        console.error(err);
        return reject(err);
      }

      window.CartoConfig = { data };
      return resolve(data);
    });
  });
}
