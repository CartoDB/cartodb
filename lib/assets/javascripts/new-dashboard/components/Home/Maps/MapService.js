import CartoNode from 'carto-node';
const client = new CartoNode.AuthenticatedClient();

export function fetchMaps () {
  const params = {
    exclude_shared: false,
    per_page: 6,
    shared: 'no',
    locked: false,
    only_liked: false,
    deepInsights: false,
    types: 'derived',
    page: 1,
    order: 'updated_at',
    order_direction: 'desc'
  };
  return new Promise(function (resolve, reject) {
    client.getVisualization(
      '',
      params,
      (err, _, data) => err ? reject(err) : resolve(data.visualizations)
    );
  });
}

export default {
  fetchMaps
};
