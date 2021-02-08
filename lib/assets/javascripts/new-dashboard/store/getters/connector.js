export function getBigqueryConnection (state) {
  return state.connections ? state.connections.find(conn => conn.connector === 'bigquery') : null;
}
export function hasBigqueryConnection (state, getter) {
  return !!getter.getBigqueryConnection;
}
