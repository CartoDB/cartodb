export async function checkGeoparquetBucket (dataset) {
  dataset = 'cdb_zcta5_fdb278bc';
  try {
    const url = `https://storage.googleapis.com/geoparquet/carto/${dataset}.parquet`;
    const response = await fetch(url, { method: 'HEAD' });
    return { ok: response.ok, url };
  } catch (e) {
    return { ok: false };
  }
}
