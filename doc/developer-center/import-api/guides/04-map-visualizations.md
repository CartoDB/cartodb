## CARTO Map Visualizations

The *Export map* option enables you to download a map, and the connected dataset, as a .carto file. This is useful for downloading complete CARTO visualizations that you can share or import.

**Note:** The Import API export visualization command only works for maps created from your dashboard.

A cURL POST request allows you to export the visualization, which you will have to poll with a GET command until the state is `complete`.

### Export a CARTO Visualization

#### Call

```bash
curl -H 'Content-Type: application/json' https://{username}.carto.com/api/v3/visualization_exports\?api_key\={api_key} -X POST --data '{"visualization_id":"{visualization_id}"}'
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
visualization_id | A unique identifier for the map created in the export process. Only applies if `create_visualization` is set to true when the map was created.

#### Response

```
{"id":"b94c26f3-fa16-4f13-b672-45ebbd5a9c95","visualization_id":"ace62506-brc8-6570-2p91-8vf3af3ftc44","user_id":"42b78090-6a11-475a-8060-0a90322752af2","state":"pending","url":null,"created_at":"2016-05-05T09:36:09+00:00","updated_at":"2016-05-05T09:36:09+00:00"}
```

_After making the POST request to create the export, it is expected that the request will take some time. You must poll the server by making a GET request, until state becomes complete._ For example:

```
curl -v -H 'Content-Type: application/json' https://{username}.carto.com/api/v3/visualization_exports/{visualization_export_id}\?api_key\={api_key} -X GET
```

Once completed, the response status changes to `complete` and displays the upload url location of the .carto visualization file:

```
{"id":"b94c26f3-fa16-4f13-b672-45ebbd5a9c95","visualization_id":"{visualization_id}","user_id":"42b78090-6a11-475a-8060-0a90322752af2","state":"complete","url":"/uploads/6a2b6fbd86e2c750160a/ace62506-brc8-6570-2p91-8vf3af3ftc44.carto","created_at":"2016-05-05T09:36:09+00:00","updated_at":"2016-05-05T09:36:13+00:00"}%
```

The response includes:

Attributes | Description
--- | ---
id | A unique identifier for the export process. It is the same as the _export id_ provided in the request.
vizualization_id | A unique identifier for the map created in the export process. Only applies if `create_visualization` is set to true when the map was created.
user_id | A unique alphanumeric element that identifies the CARTO account user in the internal database.
state | A string value indicating the current state of the export process. It can have any of the following values: _enqueued, pending, uploading, unpacking, importing, guessing, complete_, or _failure_.
url | The **public** URL address where the file to be exported is located.
created_at | The date time at which the visualization was created in the CARTO database.
updated_at | The date time at which the visualization had its contents modified.

##### Example

Example POST request:

```
curl -v -H 'Content-Type: application/json' https://{username}.carto.com/api/v3/visualization_exports\?api_key\={api_key} -X POST --data '{"visualization_id":"9a0f4384-afe3-412a-8b09-136b7d9a4013"}'
{"id":"72e488a6-cf0e-404d-bc7e-de9c9840aadf","visualization_id":"9a0f4384-afe3-412a-8b09-136b7d9a4013","user_id":"d80fe0f5-0465-4c4a-a2fe-1f14a93f3c5b","state":"pending","url":null,"created_at":"2016-05-20T07:01:38+00:00","updated_at":"2016-05-20T07:01:38+00:00"}%
```

Example completed response:

```
curl -H 'Content-Type: application/json' https://{username}.carto.com/api/v3/visualization_exports/72e488a6-cf0e-404d-bc7e-de9c9840aadf\?api_key\=04039a13c1bdda65df8bd825b3b8e8117444c950 -X GET
{"id":"72e488a6-cf0e-404d-bc7e-de9c9840aadf","visualization_id":"9a0f4384-afe3-412a-8b09-136b7d9a4013","user_id":"d80fe0f5-0465-4c4a-a2fe-1f14a93f3c5b","state":"complete","url":"http://s3.amazonaws.com/com.cartodb.imports.production/9d149e72331bf074e35f/9a0f4384-afe3-412a-8b09-136b7d9a4013.carto?AWSAccessKeyId=AKIAJK5S64CVBE35QTKA&Expires=1463734900&Signature=b4cwrdoB%2B0FlTelIzNOAgslUDXY%3D","created_at":"2016-05-20T07:01:38+00:00","updated_at":"2016-05-20T07:01:40+00:00"}%
```

### Import a CARTO Visualization

To import a .carto visualization, you can use the standard Import API procedure for uploading a local file.

See the import errors list on Support section to troubleshoot any importing errors.
