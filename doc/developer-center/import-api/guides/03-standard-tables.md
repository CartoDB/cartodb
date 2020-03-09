## Standard Tables

A standard import stores the data you upload from files with valid formats, creating tables at CARTO. These are the default tables used to store the data of the uploaded files (that will be used to create datasets and maps). Any CARTO user may create, manipulate, and delete their own datasets.

### Upload file

##### Definition

```bash
POST api/v1/imports 
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
file | When importing local files, you need to perform a POST with a file (see the call with cURL example in this section).
url | When importing remote files, the full URL to the publicly accessible file.
type_guessing | If set to `false` disables field type guessing (for Excel and CSVs). Optional. Default is `true`.
quoted_fields_guessing | If set to `false` disables type guessing of CSV fields that come inside double quotes. Optional. Default is `true`.
content_guessing | Set to `true` to enable content guessing and automatic geocoding based on results. Currently, this only implements geocoding of countries, cities and IP addresses. Optional. Default is `false`.
create_vis | Set to `true` to flag the import so that when it finishes, it creates a Map automatically after importing the Dataset. Optional. Default is `false`.
collision_strategy | Determines the behavior when importing a dataset that has the same name as an existing table. By default, it is imported and renamed with a sequential number (`mytable`,  `mytable_1`...). Optional. If you set `collision_strategy=skip`, the table with the matching name will not be imported. If you set `collision_strategy=overwrite`, it will replace the table with the matching name, but only if the schemas are compatible.
privacy | Used to set the privacy settings of the table or tables resulting from the import. If **create_vis** is set to true, the resulting visualization privacy settings will also be determined by this parameter. **privacy** can be set to:
--- | ---
<i class="Icon Icon--s5 Icon--cGrey Icon--mAlign Icon--indent"></i> public | The resulting table or visualization can be viewed by anyone.
<i class="Icon Icon--s5 Icon--cGrey Icon--mAlign Icon--indent"></i> private | The resulting table or visualization can only be viewed by the uploader.
<i class="Icon Icon--s5 Icon--cGrey Icon--mAlign Icon--indent"></i> link | The resulting table or visualization can only be viewed through a private link shared by the uploader.
table_name | Used to duplicate one of your existing tables. **Do not mix with File/URL imports**.
table_copy | Similar to *table_name*, internally used for table copying. **Do not set**.
table_id | Internal usage for table migrations. **Do not set**.
append | Reserved for future usage. **Do not set**.
sql | Used to create a new table from a SQL query applied to one of your tables. **Do not mix with File/URL imports**.
service_name | Used to upload from datasources, indicates which datasource to use. Check [here](https://github.com/CartoDB/cartodb/tree/master/services/datasources/lib/datasources) for an updated list of available datasources to use. **Intended for CARTO Builder usage**.
service_item_id | Used to upload from datasources and indicates data of the datasource. Check [here](https://github.com/CartoDB/cartodb/tree/master/services/datasources/lib/datasources) for an updated list of available datasources to use. **Intended for CARTO Builder usage**.

##### Response

The response includes:

Attributes | Description
--- | ---
item_queue_id | A unique alphanumeric identifier referencing the import process in the targeted account.
success | A boolean value indicating whether the import process was started or not.

#### Local File Upload Example

##### Call

```bash
curl -v -F file=@/path/to/local/file "https://{account}.carto.com/api/v1/imports/?api_key={account API Key}"
```

##### Response

```
{
  "item_queue_id": "9906bce0-f1a3-4b07-be71-818f4bfd7673",
  "success": true
}
```

#### URL Upload Example

##### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"url":"https://remotehost.url/path/to/remotefile"}'
"https://{account}.carto.com/api/v1/imports/?api_key={account API Key}"
```

##### Response

```
{
  "item_queue_id": "9906bce0-f1a3-4b07-be71-818f4bfd7673",
  "success": true
}
```


### Check the status of an import process

When uploading a file for import, it may take some time due to the file's size and the additional processing on the CARTO side. Using this request, an import process state can be retrieved.

##### Definition

```bash
GET /api/v1/imports/<import_id>
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.
The import identifer | A unique alphanumeric element that identifies the import process to be retrieved. It is the *item_queue_id* element returned after running the upload request successfully.

##### Response

The response includes the following items:

Attributes | Description
--- | ---
id | A unique identifier for the import process. It is the same as the *import id* provided in the request.
user_id | A unique alphanumeric element that identifies the CARTO account user in the internal database.
table_id | A unique alphanumeric element that identifies the created table in the internal CARTO database.
data_type | This element identifies the service type used to import the file. Possible values are `file`, `url`, `external_table`, `query`, `table` or `datasource`.
table_name | The final name of the created table in the targeted CARTO account. It usually has the same name as the uploaded file, unless there already exists a table with the same name (in this case, an integer number is appended to the table name).
state | A string value indicating the current state of the importing process. It can have any of the following values: *enqueued*, *pending*, *uploading*, *unpacking*, *importing*, *guessing*, *complete*, or *failure*.
error_code | A number corresponding to the error code in case of failure during the import process, that is, when the *success* item has a *false* value.
queue_id | A unique identifier for the import process in the importing queue. It is the same as the *import id* provided in the request.
tables_created_count | The number of tables that the import process generated. For multi-file uploads, this value can be greater than one. If the import process fails, its value will be `null`.
synchronization_id | This element has a *null* value when the import is not configured as a Sync Table.
type_guessing | A boolean indicating whether field type guessing (for Excel and CSVs) is enabled or not.
quoted_fields_guessing | A boolean indicating whether type guessing of CSV fields inside double quotes is enabled for the data import.
content_guessing | A boolean indicating whether content guessing and automatic geocoding is enabled for the data import.
create_visualization | A boolean indicating whether the import process will create a map automatically or not. Its value corresponds to the import option `create_vis` chosen by the user.
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to `true`.
user_defined_limits | Internal usage for user limits.
get_error_text | This element contains an error description to be outputted in case of a failure during the import process. It contains  the error title and description, its source (`user` or `cartodb`), and troubleshooting details.
display_name | Similar to `table_name`. For `url` uploads, it shows the name of the file. Otherwise, it shows the import id.
success | A boolean value indicating whether the import process succeeded (*true* or  *false*).
warnings | A text field containing warning messages related to the import process, if applicable. 
is_raster | A boolean value indicating whether the imported table contains raster data or not.

#### Example

##### Call

```bash
curl -v "https://{account}.carto.com/api/v1/imports/{import_id}?api_key={account API Key}
```

##### Response

```
{
  id: "029a6053-b2fb-43dd-baa6-805d679c404f",
  user_id: "ca8c5ace-d573-450b-8a43-6c7eafadd80e",
  table_id: null,
  data_type: "url",
  table_name: null,
  state: "failure",
  error_code: 1002,
  queue_id: "029a6053-b2fb-43dd-baa6-805d679c404f",
  tables_created_count: null,
  synchronization_id: null,
  type_guessing: true,
  quoted_fields_guessing: true,
  content_guessing: false,
  create_visualization: false,
  visualization_id: null,
  user_defined_limits: "{"twitter_credits_limit":0}",
  get_error_text: {
    title: "Unsupported/Unrecognized file type",
    what_about: "Should we support this filetype? Let us know in our <a href='mailto:support@carto.com'>support email</a>!",
    source: "user"
  },
  display_name: "shapefile_streets.cpg",
  success: false,
  warnings: null,
  is_raster: false
}
```

---

### Retrieving a list of all the current import processes

Lists the import identifiers of the files that are being imported in the targeted CARTO account.

##### Definition

```bash
GET /api/v1/imports/
```

##### Params

Param | Description
--- | ---
api_key | The target CARTO account API key.

##### Response

The response includes:

Attributes | Description
--- | ---
imports | A list of unique alphanumeric identifiers referencing the import processes in the targeted CARTO account.
success | A boolean value indicating if the request was successful.

#### Example

##### Call

```bash
curl -v "https://{account}.carto.com/api/v1/imports/?api_key={account API Key}"
```

##### Response

```
{
  "imports": [
    "1234abcd-1234-1a2b-3c4d-4321dcba5678"
    ],
  "success": true
}
```
