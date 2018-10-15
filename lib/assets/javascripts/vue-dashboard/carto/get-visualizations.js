const CartoNode = require('carto-node');
const client = new CartoNode.AuthenticatedClient();

export default function ({page}) {
  return new Promise((resolve, reject) => {
    client.getVisualization('',
      { page },
      function (err, response, data) {
        const visualizationsData = {
          data: convertToObject(data.visualizations, 'id'),
          totals: {
            entries: data.total_entries,
            likes: data.total_likes,
            user_entries: data.total_user_entries
          }
        };

        if (err) {
          console.error(err);
          return reject(err);
        }

        return resolve(visualizationsData);
      });
  });
}

const convertToObject = function (array, field) {
  return array.reduce((accumulator, current) => {
    accumulator[current[field]] = current;
    return accumulator;
  }, {});
}
