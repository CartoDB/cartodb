## Sync Tables

Sync tables are available for certain CARTO plans. These tables store data from a remote file and refresh their contents during periodic intervals specified by the user. The base files from which the sync tables retrieve their contents may come from Google Drive, Dropbox, Box or a public URL. 

### Upload and manage synced tables

##### Definition

```html
GET /api/v1/synchronizations
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.

##### Response

The response includes an **array** of items, each one containing the following elements:

Attributes | Description
--- | ---
id | A unique alphanumeric identifier of the synced table.
name | The actual name of the created sync table.
interval | An integer value representing the number of seconds between synchronizations of the table contents.
url | The **public** URL address where the file to be synchronized is located.
state | A string value indicating the current state of the synchronized dataset. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
created_at | The date time at which the table was created in the CARTO database.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synched with the source file.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
ran_at | The date time at which the table **had** its contents synched with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | See **etag**.
user_id | A unique alphanumeric element that identifies the CARTO account user in the internal database.
service_name | A string with the name of the datasource used to import the file. It can have any of the following values: *gdrive* for Google Drive, *dropbox* for Dropbox and *null* for URL imports.

service_item_id | A unique identifier used by CARTO to reference the sync table and its related datasource service.
type_guessing | A boolean indicating whether field type guessing (for Excel and CSVs) is enabled or not.
quoted_fields_guessing | A boolean indicating whether type guessing of CSV fields inside double quotes is enabled for the data import.
content_guessing | A boolean indicating whether content guessing and automatic geocoding is enabled for the data import.
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | A boolean indicating whether the Sync Table is connected to an external source, generally the CARTO Data library.

Finally, the array includes a **total_entries** element that indicates the number of items contained in the response array.

#### Example

##### Call

```bash
curl -v "https://{username}.carto.com/api/v1/synchronizations/?api_key={account API Key}"
```

##### Response

```javascript
{
  "synchronizations": [
    {
    "id": "246dae5e-5302-1ae5-af51-0e85ad047bba",
    "name": "barrios_5",
    "interval": 2592000,
    "url": "https://common-data.carto.com/api/v2/sql?q=select+*+from+%22barrios%22&format=shp&filename=barrios",
    "state": "success",
    "created_at": "2015-09-04T12:40:37+00:00",
    "updated_at": "2016-02-01T12:45:07+00:00",
    "run_at": "2016-03-02T12:45:07+00:00",
    "retried_times": 0,
    "log_id": "2d9b4a52-1daa-429b-b425-6ad561609cb1",
    "error_code": null,
    "error_message": null,
    "ran_at": "2016-02-01T12:45:07+00:00",
    "modified_at": "2015-04-22T12:17:50+00:00",
    "etag": null,
    "checksum": null,
    "user_id": "cf8a5cce-d573-4a0b-8c43-6caeaf1dd80e",
    "service_name": null,
    "service_item_id": "https://common-data.carto.com/api/v2/sql?q=select+*+from+%22barrios%22&format=shp&filename=barrios",
    "type_guessing": true,
    "quoted_fields_guessing": true,
    "content_guessing": true,
    "visualization_id": "2954fa60-5a02-11e5-888a-0e5e07bb5d8a",
    "from_external_source": false
    }
  ],
  "total_entries": 1
}
```

---

### Syncing a file from a URL

##### Definition

```html
POST /api/v1/synchronizations
```

##### Params

Param | Description
--- | ---
api_key | The targeted CARTO account API key.
url | The **public** URL address where the file to be imported is located.
interval | The number of seconds for the synchronization period. *Note*: Sync interval must be at least 900 (15 minutes).
type_guessing | If set to *false* disables field type guessing (for Excel and CSVs). Optional. Default is *true*.
quoted_fields_guessing | If set to *false* disables type guessing of CSV fields that come inside double quotes. Optional. Default is *true*.
content_guessing | Set it to *true* to enable content guessing and automatic geocoding based on results. Currently it only implements geocoding of countries. Optional. Default is *false*.

##### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the import.
item_queue_id | A unique alphanumeric identifier that refers to the import process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the import process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synched with the source file.
ran_at | The date time at which the table **had** its contents synched with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | See **etag**.
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | A string with the name of the datasource used to import the file. It can have any of the following values: *gdrive* for Google Drive, *dropbox* for Dropbox and *null* for URL imports.

service_item_id | A unique identifier used by CARTO to reference the sync table and its related datasource service.
type_guessing | A boolean indicating whether field type guessing (for Excel and CSVs) is enabled or not.
quoted_fields_guessing | A boolean indicating whether type guessing of CSV fields inside double quotes is enabled for the data import.
content_guessing | A boolean indicating whether content guessing and automatic geocoding is enabled for the data import.
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | A boolean indicating whether the Sync Table is connected to an external source, generally the CARTO Common-Data library.

#### Example

##### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"url":"https://public.url.to.file/sample_file", "interval":"3600"}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={account API Key}"
```

##### Response

```
{
  "data_import": {
    "endpoint": "/api/v1/imports",
    "item_queue_id": "1234abcd-1234-1a2b-3c4d-4321dcba5678"
  },
  "id": "abcd1234-a5b6-c7d8-1a2b-efgh5678abcd",
  "name": null,
  "interval": 3600,
  "url": "https://public.url.to.file/sample_file",
  "state": "created",
  "user_id": "aaaabbbb-1234-5678-dcba-abcd1234efgh",
  "created_at": "2014-08-05T13:39:15+00:00",
  "updated_at": "2014-08-05T13:39:15+00:00",
  "run_at": "2014-08-05T14:39:15+00:00",
  "ran_at": "2014-08-05T13:39:15+00:00",
  "modified_at": null,
  "etag": null,
  "checksum": "",
  "log_id": "06fafab8-3502-11e4-9514-0e230854a1cb",
  "error_code": null,
  "error_message": null,
  "retried_times": 0,
  "service_name": null,
  "service_item_id": null,
  "type_guessing": true,
  "quoted_fields_guessing": true,
  "content_guessing": false,
  "visualization_id": null,
  "from_external_source": false
}
```

---

### Removing the synchronization feature from a given dataset

A sync table can be converted to a standard dataset (a dataset that never gets synced).

##### Definition

```bash
DELETE /api/v1/synchronizations/<import_id>
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
Target table import id | The unique alphanumeric identifier of the target sync dataset.

#### Example

##### Call

```bash
curl -v -X "DELETE" https://{username}.carto.com/api/v1/synchronizations/{import_id}?api_key={account API Key}"
```

##### Response

An HTTP No content - 204 response should result as a confirmation for the removal of the synchronization feature for the target table.

---

### Check whether a sync table is syncing or not

A large synced table may take some time to get fully synced. In the meantime, it could be useful to check whether it finished refreshing its contents.

##### Definition

```bash
GET /api/v1/synchronizations/<import_id>/sync_now
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
Target table import id | The unique alphanumeric identifier of the target sync table.

##### Response

The response includes the following items:

Attributes | Description
--- | ---
state | A string value indicating the status of the synchronization. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.

#### Example

##### Call

```bash
curl -v -X "GET" "https://{username}.carto.com/api/v1/synchronizations/{import_id}/sync_now?api_key={account API Key}"
```

##### Response

```
{
  "state": "syncing"
}
```

---

### Force a synchronization action on a sync table

Sync tables have their contents synchronized with the source file in periodic time intervals as specified by the user during the creation process. However, a dataset can be synchronized at an arbitrary moment in time if desired. **Note**: Forcing a synchronization can only be performed when the last synchronization attempt occurred at least 900 seconds (15 minutes) before.

#### Definition

```bash
PUT /api/v1/synchronizations/<import_id>/sync_now
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
Target table import id | The unique alphanumeric identifier of the target sync table.

#### Response

The response includes the following items:

Attributes | Description
--- | ---
enqueued | A boolean value indicating whether the request has been successfully appended to the processing queue.
synchronization_id | A unique alphanumeric identifier referring to the queue element just added.

#### Example

##### Call

```bash
curl -v -X "PUT" "https://{username}.carto.com/api/v1/synchronizations/<import_id>/sync_now?api_key={account API Key}" -H "Content-Length:0"
```

##### Response

```bash
{
  "enqueued": true,
  "synchronization_id": "1234abcd-aaaa-2222-4444-dcba4321a1b2"
}
```
