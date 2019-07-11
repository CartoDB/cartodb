## Importing an ArcGIS&trade; Layer

The ArcGIS&trade; Connector allows you to import ArcGIS&trade; layers into a CARTO account as dataset from ArcGIS Server&trade; (version 10.1 or higher is required). Note that **this connector is disabled by default** in the CARTO importer options. If you are interested in enabling it, please contact [support@carto.com](mailto:support@carto.com) for more details.

**Tip:** You can easily import ArcGIS&trade; server table URLs from CARTO Builder, with the ArcGIS Server&trade; Connect Dataset option.

### Import an ArcGIS&trade; Layer

ArcGIS&trade; layers stored in ArcGIS Server&trade; can get imported as CARTO datasets. Such layers must be (PUBLIC) and accessible via an **ArcGIS&trade; API REST URL**, using the following structure:

```html
http://<host>/<site>/rest/services/<folder>/<serviceName>/<serviceType>/<layer_ID>
```

##### Definition

```bash
POST api/v1/imports 
```

##### Params

Param | Description
--- | ---
interval | This value **MUST** be set to *0*. **Different values do not guarantee correct imports**.
service_item_id | The ArcGIS&trade; API REST URL where the ArcGIS&trade; layer is located.
service_name | This value **MUST** be set to *arcgis* to make use of this connector.
value | Same URL as specified in the *service_item_id* parameter.

##### Response

The response includes:

Attributes | Description
--- | ---
item_queue_id | A unique alphanumeric identifier referencing the imported file in the targeted account.
success | A boolean value indicating whether the import process was successfully appended to the processing queue or not.

#### Example

##### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"interval":"0","service_item_id": "http://url.to.arcgis.server.layer", "service_name": "arcgis", "value": "http://url.to.arcgis.server.layer"}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

##### Response

```
{
  "item_queue_id": "d676fd50-b774-4052-a4f1-e56ac6a4300e",
  "success": true
}
```

### Syncing an ArcGIS&trade; Layer

An ArcGIS&trade; layer can get imported to a CARTO account as a synchronized table. The target ArcGIS&trade; layer must be (PUBLIC) and accessible via an ArcGIS&trade; API REST URL, using the following structure:
```html
http://<host>/<site>/rest/services/<folder>/<serviceName>/<serviceType>/<layer_ID>
```

##### Definition

```bash
POST /api/v1/synchronizations
```

##### Params

Param | Description
--- | ---
interval | The number of seconds for the synchronization period. *Note*: Sync interval must be at least 900 (15 minutes).
service_item_id | The ArcGIS&trade; API REST URL where the ArcGIS&trade; dataset is located. **Note:** Layers and Datasets must be (PUBLIC) and accessible via an ArcGIS&trade; API REST URL. You cannot enforce ArcGIS Server security parameters into the request, the REST endpoints must be publicly available.
service_name | This value **MUST** be set to *arcgis* to make use of this connector.
url | This value **MUST** be empty.

##### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the import.<br/><br/>
item_queue_id | A unique alphanumeric identifier that refers to the import process. It can be used to retrieve data related to the created dataset.
id | An alphanumeric identifier used internally by CARTO as a reference to the import process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
url | This value is empty in this case.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the dataset was created in the CARTO Engine.
updated_at | The date time at which the dataset had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the dataset was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | See **etag**.
log_id | A unique alphanumeric identifier to locate the log traces of the given dataset.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This value is set to *arcgis*.
service_item_id | This item contains the ArcGIS&trade; API REST URL targeting the imported ArcGIS&trade; layer.
type_guessing | A boolean indicating whether field type guessing (for Excel and CSVs) is enabled or not.
quoted_fields_guessing | A boolean indicating whether type guessing of CSV fields inside double quotes is enabled for the data import.
content_guessing | A boolean indicating whether content guessing and automatic geocoding is enabled for the data import.
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | A boolean indicating whether the Sync Table is connected to an external source, generally the CARTO Common-Data library.

#### Example

##### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"interval":"604800","service_item_id": "http://url.to.arcgis.server.layer", "service_name": "arcgis", "url":""}' "https://{username}.carto.com/api/v1/synchronizations?api_key={API_KEY}"
```

##### Response

```
{
  "endpoint":"/api/v1/imports",
  "item_queue_id":"4ff4abdd-9d37-4b7a-8e13-fb00376e2a58",
  "id":"d4bc05e8-5063-11e4-9886-0e018d66dc29",
  "name":null,
  "interval":604800,
  "url":"",
  "state":"created",
  "user_id":"4884b545-07f4-4ce4-a62f-fe9e2412098f",
  "created_at":"2014-10-10T09:57:22+00:00",
  "updated_at":"2014-10-10T09:57:22+00:00",
  "run_at":"2014-10-17T09:57:22+00:00",
  "ran_at":"2014-10-10T09:57:22+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":"6aa19bf6-42db-477a-9b69-2c4f74fd8c31",
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"arcgis",
  "service_item_id":"http://url.to.arcgis.layer",
  "type_guessing": true,
  "quoted_fields_guessing": true,
  "content_guessing": true,
  "visualization_id": "2954fa60-5a02-11e5-888a-0e5e07bb5d8a",
  "from_external_source": false
}
```

### Import an ArcGIS&trade; Dataset

This option allows you to programmatically import a complete set of layers belonging to an ArcGIS&trade; dataset (as opposed to using CARTO Builder ArcGIS Server&trade; Connect Dataset option). Such a dataset must be (PUBLIC) and accessible via an ArcGIS&trade; API REST URL, using the following structure:

```html
http://<host>/<site>/rest/services/<folder>/<serviceName>/<serviceType>/
```

##### Definition

```bash
POST api/v1/imports 
```

##### Params

Param | Description
--- | ---
interval | This value **MUST** be set to *0*. **Different values do not guarantee correct imports**.
service_item_id | The ArcGIS&trade; API REST URL where the ArcGIS&trade; dataset is located.
service_name | This value **MUST** be set to *arcgis* to make use of this connector.
value | Same URL as specified in the *service_item_id* parameter

##### Response

The response includes:

Attributes | Description
--- | ---
item_queue_id | A unique alphanumeric identifier referencing the imported file in the targeted account.
success | A boolean value indicating whether the file import succeeded or not.

#### Example

##### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"interval":"0","service_item_id": "http://url.to.arcgis.server.dataset", "service_name": "arcgis", "value": "http://url.to.arcgis.server.dataset"}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

##### Response

```
{
  "item_queue_id": "c478fd50-f984-4091-d1f2-e72ac6c4333e",
  "success": true
}
```

### Limits

Connections to ArcGIS&trade; server are limited by two types of timeouts: connection and response timeouts.

#### Connection timeout

Connection timeout to the ArcGIS&trade; server is set to 60 seconds.

This means if the ArcGIS&trade; server does not respond to a request in 60 seconds the connection is closed and the synchronization of the dataset will fail.

In the vast majority of cases a connection timeout means there's something wrong in the ArcGIS&trade; server, so you should contact the server administrator for more details about the issue.

#### Response timeout

Response timeout from the ArcGIS&trade; server is set to 60 seconds.

This means the ArcGIS&trade; server did not finish the request in 60 seconds, after the connection was made, so the resulting dataset will be incomplete and the import will fail with a `Download timeout` error code.

Response timeouts can happen for a number of reasons, the more commons ones are because the ArcGIS&trade; server is overloaded and is not able to respond in a timely manner or the dataset is too big to be transferred in 60 seconds from the server to CARTO.

In any case, we recommend you to first check any issue with the ArcGIS&trade; server administrator and if that does not solve the issue contact us at [support@carto.com](mailto:support@carto.com) for more details.
