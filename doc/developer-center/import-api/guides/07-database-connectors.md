## Database Connectors

Typically when you import data, you are fetching a file or layer of data and importing it into a table. CARTO creates and formats the default columns and indexes during the import process.

Alternatively, you can use the Import API to connect to an external database. Your data from the external database is cached into a CARTO table by using the `connector` parameters.

There are several types of database connectors available for Enterprise CARTO accounts.

### The MySQL Connector

The MySQL Connector allows you to import data into a CARTO account as tables from a MySQL database.

You can use the MySQL Connector to:

- Import a single, whole table stored in your MySQL database
- Apply a SQL query to import filtered data
- Apply a SQL query from multiple joined tables

To use the MySQL Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"myserver.com",
      "database":"mydatabase",
      "username":"myusername",
      "password":"mypassword"
    },
    "table": "mytable",
    "encoding": "iso88591"
  }
}
```

#### Supported Versions

The MySQL Connector is designed to work with MySQL 4.1.1 and later versions.
Its correct operation has been tested using MySQL 5.5 and 5.7.

#### Connector Attributes

The following table describes the connector attributes required to connect to a MySQL database.

Param | Description
--- | ---
connector | This value **MUST** be set to *mysql*.
connection |  Provide the parameters that permit connection to the remote database.
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.
import_as | Defines the name of the resulting CARTO dataset
encoding | The character encoding used by the MySQL database.

For the `encoding` attribute, any of the [PostgreSQL character set names or aliases](https://www.postgresql.org/docs/10/static/multibyte.html) can be applied.

#### Encoding Connection Parameters

The following table describes the parameters required to connect to the remote database.

Param | Description
--- | ---
server | The host address, or name, of the MySQL database server.
port |  TCP port where the MySQL is running (3306 by default)
database | The name of the database to connect to.
username | User name used to connect to MySQL.
password | Password of the user account.

#### Connect to a Table

In order to connect to an external MySQL database table, the following rules apply:

- The name of the remote MySQL table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- If the `import_as` parameter is present it will define the name of the CARTO dataset produced.
  By default the name of the remote table (`table`) will be used.

#### Legacy `table` parameter usage

The `import_as` parameter is used to give a name to the imported query (`sql_query`) or
an imported external table (`table`). In the latter case it is optional and the table
original name will be preserved by default.

The `table` parameter could be originally used also for the CARTO dataset name of
an imported query. This usage is preserved for backwards compatibility but is now deprecated;
please use the `import_as` parameter in that case. Use `table` only when you're importing
an external table, not a query.

##### Example

The following example displays how to request an external MySQL table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"myserver.com",
      "database":"mydatabase",
      "username":"myusername",
      "password":"mypassword"
    },
    "table": "mytable",
    "encoding": "iso88591"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through
the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote MySQL database, not by PostgreSQL, so its syntax should follow MySQL conventions.

The `import_as` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account. Note that formerly the `table` parameter was used for that purpose; such use is now deprecated.

##### Example

The following example displays how to connect to MySQL through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"myserver.com",
      "database":"mydatabase",
      "username":"myusername",
      "password":"mypassword"
    },
    "import_as": "mytable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1",
    "encoding": "iso88591"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"myserver.com",
      "database":"mydatabase",
      "username":"myusername",
      "password":"mypassword"
    },
    "import_as": "mytable",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'",
    "encoding": "iso88591"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external MySQL database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"myserver.com",
      "database":"mydatabase",
      "username":"myusername",
      "password":"mypassword"
    },
    "import_as": "mytable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1",
    "encoding": "iso88591"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
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
checksum | Same as the **etag** descripion (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"mysql\",\"connection\":{\"server\":\"tests-myserver.com\",\"username\":\"myusername\",\"password\":\"mypasswrod\",\"database\":\"mydatabase\"},\"table\":\"mytable\",\"encoding\":"iso88591\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

### The PostgreSQL Connector

The PostgreSQL Connector allows you to import data into a CARTO account as tables from a PostgreSQL database.

You can use the PostgreSQL Connector to:

- Import a single, whole table stored in your PostgreSQL database
- Apply a SQL query to import filtered data
- Apply a SQL query from multiple joined tables

To use the PostgreSQL Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "postgres",
    "connection": {
      "server":"pgserver.com",
      "database":"pgdatabase",
      "username":"pgusername",
      "password":"pgpassword"
    },
    "schema": "public",
    "table": "pgtable"
  }
}
```

#### Supported Versions

CARTO has tested the correct operation of this connector with PostgreSQL 9.3 and 9.5.

#### Connector Attributes

The following table describes the connector attributes required to connect to a PostgreSQL database.

Param | Description
--- | ---
connector | This value **MUST** be set to *postgres*.
connection |  Provide the parameters that permit connection to the remote database.
schema | Remote schema of the table to be imported ("public" by default).
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.

#### Encoding Connection Parameters

The following table describes the encoding parameters required to connect to the remote database.

Param | Description
--- | ---
server | The host address, or name, of the PostgreSQL database server.
port |  TCP port where the PostgreSQL is running (5432 by default).
database | The name of the database to connect to.
username | User name used to connect to PostgreSQL.
password | Password of the user account.
sslmode  | Determines the use of SSL to connect to the database. The accepted values are `require` (which is the default), `prefer` and `disable`.

##### SSL Connections

By default, only [SSL](https://en.wikipedia.org/wiki/Transport_Layer_Security) connections will be used to connect to the server, providing eavesdropping protection.
If the server does not support SSL, the connection will fail. This behavior can be changed with the `sslmode` connection parameter:

sslmode | Description
------- | -----------
require | Only SSL connections are possible.
prefer  | If the server supports it, SSL is used. Otherwise, a non-SSL connection is used.
disable | SSL will not be be used under any circumstances.

#### Connect to a Table

In order to connect to an external PostgreSQL database table, the following rules apply:

- The name of the remote PostgreSQL table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

##### Example

The following example displays how to request an external PostgreSQL table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "postgres",
    "connection": {
      "server":"pgserver.com",
      "database":"pgdatabase",
      "username":"pgusername",
      "password":"pgpassword"
    },
    "table": "pgtable"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote PostgreSQL database.

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to PostgreSQL through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "postgres",
    "connection": {
      "server":"pgserver.com",
      "database":"pgdatabase",
      "username":"pgusername",
      "password":"pgpassword"
    },
    "table": "pgtable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "postgres",
    "connection": {
      "server":"pgserver.com",
      "database":"pgdatabase",
      "username":"pgusername",
      "password":"pgpassword"
    },
    "table": "pgtable",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external PostgreSQL database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "postgres",
    "connection": {
      "server":"pgserver.com",
      "database":"pgdatabase",
      "username":"pgusername",
      "password":"pgpassword"
    },
    "table": "pgtable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | Same as the **etag** description (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"postgres\",\"connection\":{\"server\":\"tests-pgserver.com\",\"username\":\"pgusername\",\"password\":\"pgpasswrod\",\"database\":\"pgdatabase\"},\"table\":\"pgtable\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

### The Microsoft SQL Server Connector

The Microsoft SQL Server Connector allows you to import data into a CARTO account as tables from a Microsoft SQL Server database.

You can use the Microsoft SQL Server Connector to:

- Import a single, whole table stored in your Microsoft SQL Server database
- Apply a SQL query to import filtered data
- Apply a SQL query from multiple joined tables

To use the Microsoft SQL Server Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "sqlserver",
    "connection": {
      "server":"msserver.com",
      "database":"msdatabase",
      "username":"msusername",
      "password":"mspassword"
    },
    "schema": "dbo",
    "table": "mstable"
  }
}
```

#### Supported Versions

CARTO has tested the correct operation of this connector with Microsoft SQL Server 2014 (version 12.0) and Microsoft SQL Server 2016 (version 13.0).

#### Connector Attributes

The following table describes the connector attributes required to connect to a Microsoft SQL Server database.

Param | Description
--- | ---
connector | This value **MUST** be set to *sqlserver*.
connection |  Provide the parameters that permit connection to the remote database.
schema | Remote schema of the table to be imported ("dbo" by default).
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.
encoding | The character encoding used by the Microsoft SQL Server database.

For the `encoding` attribute, any of the [PostgreSQL character set names or aliases](https://www.postgresql.org/docs/10/static/multibyte.html) can be applied.

#### Encoding Connection Parameters

The following table describes the encoding parameters required to connect to the remote database.

Param | Description
--- | ---
server | The host address, or name, of the Microsoft SQL Server database server.
port |  TCP port where the Microsoft SQL Server is running (1433 by default).
database | The name of the database to connect to.
username | User name used to connect to Microsoft SQL Server.
password | Password of the user account.

#### Connect to a Table

In order to connect to an external Microsoft SQL Server database table, the following rules apply:

- The name of the remote Microsoft SQL Server table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

##### Example

The following example displays how to request an external Microsoft SQL Server table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "sqlserver",
    "connection": {
      "server":"msserver.com",
      "database":"msdatabase",
      "username":"msusername",
      "password":"mspassword"
    },
    "table": "mstable"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote Microsoft SQL Server database, not by PostgreSQL, so its syntax should follow Microsoft SQL Server conventions.

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to Microsoft SQL Server through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "sqlserver",
    "connection": {
      "server":"msserver.com",
      "database":"msdatabase",
      "username":"msusername",
      "password":"mspassword"
    },
    "table": "mstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "sqlserver",
    "connection": {
      "server":"msserver.com",
      "database":"msdatabase",
      "username":"msusername",
      "password":"mspassword"
    },
    "table": "mstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external Microsoft SQL Server database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "sqlserver",
    "connection": {
      "server":"msserver.com",
      "database":"msdatabase",
      "username":"msusername",
      "password":"mspassword"
    },
    "table": "mstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | Same as the **etag** descripion (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"sqlserver\",\"connection\":{\"server\":\"tests-msserver.com\",\"username\":\"msusername\",\"password\":\"mspasswrod\",\"database\":\"msdatabase\"},\"table\":\"mstable\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

#### Geography columns

SQL Server columns of type GEOGRAPHY can be imported as the geometry of the resulting CARTO dataset
(the `the_geom` column). In order to do so, the SQL Server column needs to be converted to either binary (`STAsBinary`) or text (`STAsText`) format and be name as `the_geom`. In addition, at present time, due to technical issues soon to be resolved, you must cast the result to type `VARCHAR(1000)`. You'll need to use a query (`sql_query` parameter) to do so:

```sql
SELECT *, CONVERT(VARCHAR(1000), my_geography.STAsBinary(), 2) as the_geom FROM my_table
```

##### Tip: define points by longitude and latitude

In case your SQL Server table specifies geographic locations using longitude and latitude numeric columns, you could import them as geometry like this:

```sql
SELECT *, CONVERT(VARCHAR(1000), geography::Point(latitude, longitude, 4326).STAsBinary(), 2) AS the_geom FROM my_table
```

### The Hive Connector

The Hive Connector allows you to import data into a CARTO account as tables from a HiveServer2 database. Note that this connector is available only for CARTO On-Premises version.

You can use the Hive Connector to:

- Import a single, whole table stored in your Hive database
- Apply a SQL query to import filtered data
- Apply a SQL query from multiple joined tables

To use the Hive Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "hive",
    "connection": {
      "server":"hs2server.com",
      "database":"hs2database",
      "username":"hs2username",
      "password":"hs2password"
    },
    "schema": "default",
    "table": "hs2table"
  }
}
```

#### Supported Versions

This connector is designed to work with Hive 0.11 and later versions through HiveServer2
(HiveServer version 1 is not supported).
Its correct operation has been tested using Hive 2.1 and Hadoop 2.7.

#### Connector Attributes

The following table describes the connector attributes required to connect to a Hive database.

Param | Description
--- | ---
connector | This value **MUST** be set to *hive*.
connection |  Provide the parameters that permit connection to the remote database.
schema | Remote schema of the table to be imported ("default" by default).
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.
encoding | The character encoding used by the Hive database.

For the `encoding` attribute, any of the [PostgreSQL character set names or aliases](https://www.postgresql.org/docs/10/static/multibyte.html) can be applied.

#### Encoding Connection Parameters

The following table describes the encoding parameters required to connect to the remote database.

Param | Description
--- | ---
server | The host address, or name, of the Hive database server.
port |  TCP port where the Hive is running (10000 by default).
database | The name of the database to connect to.
username | User name used to connect to Hive.
password | Password of the user account.

#### Connect to a Table

In order to connect to an external Hive database table, the following rules apply:

- The name of the remote Hive table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

##### Example

The following example displays how to request an external Hive table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "hive",
    "connection": {
      "server":"hs2server.com",
      "database":"hs2database",
      "username":"hs2username",
      "password":"hs2password"
    },
    "table": "hs2table"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote Hive database, not by PostgreSQL, so its syntax should follow Hive conventions.

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to Hive through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "hive",
    "connection": {
      "server":"hs2server.com",
      "database":"hs2database",
      "username":"hs2username",
      "password":"hs2password"
    },
    "table": "hs2table",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "hive",
    "connection": {
      "server":"hs2server.com",
      "database":"hs2database",
      "username":"hs2username",
      "password":"hs2password"
    },
    "table": "hs2table",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external Hive database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "hive",
    "connection": {
      "server":"hs2server.com",
      "database":"hs2database",
      "username":"hs2username",
      "password":"hs2password"
    },
    "table": "hs2table",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | Same as the **etag** description (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"hive\",\"connection\":{\"server\":\"tests-hs2server.com\",\"username\":\"hs2username\",\"password\":\"hs2passwrod\",\"database\":\"hs2database\"},\"table\":\"hs2table\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

### The BigQuery Connector (BETA)

**Warning:** This connector is in **BETA** stage and the API might change or have limited support-

**Warning:** As of 2021-01-14 the following parameters of the BETA connector has been removed:
* `storage_api`: Now Storage API is always used
* `location`
* Also note that the `project` and `dataset` parameters could be used in the past as default values for table
  names referenced in `sql_query`. Now tables in queries must be fully qualified with project and dataset names
  (`project.dataset.table`) and these parameters are used only for `table` imports.

The BigQuery Connector allows you to import data into a CARTO account as tables from BigQuery.

You can use the BigQuery Connector to:

- Import a single, whole table stored in your BigQuery database
- Apply a (Standard) SQL query to import filtered data
- Apply a (Standard) SQL query from multiple joined tables

#### CARTO and BigQuery

Before using the BigQuery Connector you need to connect your CARTO account to your BigQuery (which authorizes CARTO to access your BigQuery data on your behalf).
You can do this by going to your profile (Settings in top right menu) and then select `Account` on the left.
You can use the same page to disconnect your CARTO account from your BigQuery.

You can also use the BigQuery connector directly from your dashboard using the "Add Dataset" function.

#### BigQuery pricing and expenses

This service is subject to charges in your BigQuery project, according to your pricing settings. Please check https://cloud.google.com/bigquery/pricing for more information.
Note that this connector uses the [BigQuery Storage API](https://cloud.google.com/bigquery/docs/reference/storage/) to transfer the data; see "BigQuery Storage API Pricing" in the Google BigQuery documentation: https://cloud.google.com/bigquery/pricing#storage-api.

##### The billing project

The project expenses are billed is the one set through the `billing_project` parameter, which is mandatory.

Query charges apply to the billing project regardless of the project acting as source of data.

For example, you may be granted access to CARTO's Data Observatory project. BigQuery storage expenses do not apply to the data hosted in CARTO's projects, but queries needed to import and synchronize will be charged to your billing project.

##### Sync tables

[Sync tables](https://carto.com/developers/import-api/guides/sync-tables/) run queries to refresh their content at periodic intervals. Please note they **may be a source of recurrent charges** to your billing project if you use them. As a general rule do not set a sync interval below your expected update frequency.

Future versions of this service may avoid queries when source tables are not updated.

#### Geography columns

BigQuery columns of type GEOGRAPHY can be imported as the geometry of the resulting CARTO dataset
(the `the_geom` column). In order to do so, the BigQuery column needs to have one of these names:
`geometry`, `the_geom`,  `wkb_geometry`, `geom` or `wkt`. If your geography doesn't have one of those names,
you could use a query (`sql_query` parameter) and rename your columns using `AS`:

```sql
SELECT my_othercolumn, my_geography AS the_geom FROM my_project.my_dataset.my_table
```

##### Tip: define points by longitude and latitude

In case your BigQuery table specifies geographic locations using longitude and latitude numeric columns, you could import them as geometry by using the BigQuery [ST_GEOGPOINT](https://cloud.google.com/bigquery/docs/reference/standard-sql/geography_functions#st_geogpoint) function to convert them into a GEOGRAPHY like this:

```sql
SELECT my_othercolumn, ST_GEOGPOINT(my_long_column, my_lat_column) AS the_geom FROM my_project.my_dataset.my_table
```

#### Parameters and Usage

To use the BigQuery Connector with the Import API, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "bigquery",
    "billing_project":"mybigquerybillingproject",
    "project":"mybigqueryproject",
    "dataset": "mybigquerydataset",
    "table": "mytable",
    "import_as": "mycartodataset"
  }
}
```

The following table describes the connector attributes required to connect to a BigQuery database.

Param | Description
--- | ---
provider | Required. This value **MUST** be set to *bigquery*.
billing_project | Required. Defines the Google Cloud project where the queries will be executed (charges will apply here).
project | Defines the Google Cloud project that contains the data to be imported (optional).
dataset | Name of the dataset to import data from (optional).
table \| sql_query | Required. Either identify the BigQuery table to be imported or use a SQL query to fetch data.
import_as | Can be used to specifiy the name of the imported dataset (optional)

Note that you could either import from a query using `sql_query` or from a table using `table`.

#### Import a Table

In order to connect to an external BigQuery table, the following rules apply:

- The name of the remote BigQuery project can be passed in the `project` parameter. It defaults to the billing project.
- The name of the remote BigQuery dataset must be passed in the `dataset` parameter.
- The name of the remote BigQuery table must be passed in the `table` parameter.
- The `sql_query` parameter **MUST NOT** be present.
- The desired name for the resulting CARTO dataset can be passed in the `import_as` parameter. By default
  the name of the BigQuery table (`table`) will be used.

##### Example

The following example displays how to request an external BigQuery table.
called `mytable` which belongs to the dataset `mybigquerydataset` and this, in turn,
to the project `mybigqueryproject` which is also the project for billing expenses.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "bigquery",
    "billing_project":"mybigqueryproject",
    "dataset": "mybigquerydataset",
    "table": "mytable",
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Import a query

The query must be passed in the `sql_query` parameter as [BigQuery Standard SQL](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax).
Note that this quey will be processed by your BigQuery billing project.

If importing a query, `project` and `dataset` will be ignored; the query should include
refer to tables including the project and dataset using the form `project.dataset.table`).

In this case, the parameter `import_as` is mandatory to name the imported data.

The `import_as` parameter must also be used to define the name of the local table.
This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to BigQuery through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "bigquery",
    "billing_project":"mybigqueryproject",
    "import_as": "mycartotable",
    "sql_query": "SELECT * FROM mybigquerydataset.mytable WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external BigQuery database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "bigquery",
    "billing_project":"mybigqueryproject",
    "import_as": "mycartotable",
    "sql_query": "SELECT * FROM mybigquerydataset.mytable WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
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
checksum | Same as the **etag** descripion (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"bigquery\",\"project\":\"mybigquerydataset\"},\"table\":\"mylocaltable\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

### The Amazon Redshift Connector (BETA)

**Warning:** This connector is in **BETA** stage and the API might change or have limited support-
Note that **this connector is disabled by default** in the CARTO importer options.Please request access to the beta trhough the CARTO dashboard.

The Redshift Connector allows you to import data into a CARTO account as tables from a Redshift database.

You can use the Redshift Connector to:

- Import a single, whole table stored in your PostgreSQL database
- Apply a SQL query to import filtered data
- Apply a SQL query from multiple joined tables

To use the Redshift Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "redshift",
    "connection": {
      "cluster":"redshift-cluster.xxxx.region.redshift.amazonaws.com",
      "database":"rsdatabase",
      "username":"rsusername",
      "password":"rspassword"
    },
    "schema": "public",
    "table": "rstable"
  }
}
```

#### Connector Attributes

The following table describes the connector attributes required to connect to a Redshift database.

Param | Description
--- | ---
connector | This value **MUST** be set to *redshift*.
connection |  Provide the parameters that permit connection to the remote database.
schema | Remote schema of the table to be imported ("public" by default).
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.

#### Encoding Connection Parameters

The following table describes the encoding parameters required to connect to the remote database.

Param | Description
--- | ---
cluster | The address of the Redshift cluster.
port |  TCP port (5439 by default).
database | The name of the database to connect to.
username | User name used to connect to Redshift.
password | Password of the user account.

#### Connect to a Table

In order to connect to an external Redshift database table, the following rules apply:

- The name of the remote Redshift table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

##### Example

The following example displays how to request an external Redshift table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "redshift",
    "connection": {
      "cluster":"redshift-cluster.xxxx.region.redshift.amazonaws.com",
      "database":"rsdatabase",
      "username":"rsusername",
      "password":"rspassword"
    },
    "table": "rstable"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote Redshift database.

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to Redshift through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "redshift",
    "connection": {
      "cluster":"redshift-cluster.xxxx.region.redshift.amazonaws.com",
      "database":"rsdatabase",
      "username":"rsusername",
      "password":"rspassword"
    },
    "table": "rstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "redshift",
    "connection": {
      "cluster":"redshift-cluster.xxxx.region.redshift.amazonaws.com",
      "database":"rsdatabase",
      "username":"rsusername",
      "password":"rspassword"
    },
    "table": "rstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external Redshift database.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "redshift",
    "connection": {
      "cluster":"redshift-cluster.xxxx.region.redshift.amazonaws.com",
      "database":"rsdatabase",
      "username":"rsusername",
      "password":"rspassword"
    },
    "table": "rstable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | Same as the **etag** description (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"redshift\",\"connection\":{\"cluster\":\"redshift-cluster.xxxx.region.redshift.amazonaws.com\",\"username\":\"rsusername\",\"password\":\"rspasswrod\",\"database\":\"rsdatabase\"},\"table\":\"rstable\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

#### Geometry columns

Redshift columns of type GEOMETRY or GEOGRAPHY can be imported as the geometry of the resulting CARTO dataset
(the `the_geom` column). In order to do so, the Redshift column needs to have one of these names:
`geometry`, `the_geom`,  `wkb_geometry`, `geom` or `wkt`. If your geography doesn't have one of those names,
you could use a query (`sql_query` parameter) and rename your columns using `AS`:

```sql
SELECT my_othercolumn, my_geography AS the_geom FROM my_table
```

##### Tip: define points by longitude and latitude

In case your Redshift table specifies geographic locations using longitude and latitude numeric columns, you could import them as geometry by using the Redshift [ST_MakePoint](https://docs.aws.amazon.com/redshift/latest/dg/ST_MakePoint-function.html) function to convert them into a GEOMETRY like this:

```sql
SELECT my_othercolumn, ST_MakePoint(my_long_column, my_lat_column) AS the_geom FROM my_table
```

### The Snowflake Connector (BETA)

**Warning:** This connector is in **BETA** stage and the API might change or have limited support-
Note that **this connector is disabled by default**. Please request access to the beta through the CARTO dashboard

The Snowflake Connector allows you to import data into a CARTO account as tables from Snowflake.

You can use the Snowflake Connector to:

- Import a single, whole table stored in your Snowflake database
- Apply a (Standard) SQL query to import filtered data
- Apply a (Standard) SQL query from multiple joined tables

To use the Snowflake Connector, you must include a `connector` parameter with the following attributes:

```javascript
{
  "connector": {
    "provider": "snowflake",
    "connection": {
      "server":"xxx.snowflakecomputing.com",
      "database":"sfdatabase",
      "username":"sfusername",
      "password":"sfpassword"
    },
    "schema": "PUBLIC",
    "table": "sftable"
  }
}
```

#### Connector Attributes

The following table describes the connector attributes required to connect to a Snowflake database.

Param | Description
--- | ---
connector | This value **MUST** be set to *snowflake*.
connection |  Provide the parameters that permit connection to the remote database.
schema | Remote schema of the table to be imported ("PUBLIC" by default).
table | Identifies the table to be imported.
sql_query | Allows you to import a dataset defined by a SQL query. This is optional.

#### Encoding Connection Parameters

The following table describes the encoding parameters required to connect to the remote database.

Param | Description
--- | ---
server | The address of the Snowflake server.
database | database | Name of the database that contains the table to be imported (or default database for the query in sql_query)
username | User name used to connect to Redshift.
password | Password of the user account.
warehouse | Specifies the [warehose](https://docs.snowflake.com/en/user-guide/warehouses.html) to use (optional).

#### Connect to a Table

In order to connect to an external Snowflake database table, the following rules apply:

- The name of the remote Snowflake table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

##### Example

The following example displays how to request an external Snowflake table.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "snowflake",
    "connection": {
      "server":"xxx.snowflakecomputing.com",
      "database":"sfdatabase",
      "username":"sfusername",
      "password":"sfpassword"
    },
    "table": "sftable"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

As when importing files, the response returns a success value if the connection is correctly registered (enqueued to processed):

```javascript
{
  "item_queue_id": "aef9925c-31dd-11e4-a95e-0edbca4b5058",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the connection process. Once this process has started, its status can be obtained by making a request to the imports endpoint, as described in [_Check the status of an import process_]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) documentation.

#### Connect to a SQL Query

The SQL code to select the data that is imported from the remote database must be passed through the `connector`/`sql_query` parameter. Note that the SQL query is interpreted by the remote Snowflake database.

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

##### Example

The following example displays how to connect to Snowflake through a SQL query.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "snowflake",
    "connection": {
      "server":"xxx.snowflakecomputing.com",
      "database":"sfdatabase",
      "warehouse":"sfwarehouse",
      "username":"sfusername",
      "password":"sfpassword"
    },
    "table": "sftable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

**Tip:** If you are using `curl` and need to have single quotes in your SQL query, you must substitute each single quote by the sequence `'"'"'`. For example, if the query is `SELECT * FROM remote_table WHERE value = '1'``

Enter it as:

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "snowflake",
    "connection": {
      "server":"xxx.snowflakecomputing.com",
      "database":"sfdatabase",
      "warehouse":"sfwarehouse",
      "username":"sfusername",
      "password":"sfpassword"
    },
    "table": "sftable",
    "sql_query": "SELECT * FROM remote_table WHERE value = '"'"'1'"'"'"
  }
}' "https://{username}.carto.com/api/v1/imports/?api_key={API_KEY}"
```

###### Response

The results indicate if the connection was registered successfully, and includes the identifier that references the connection process.

```javascript
{
  "item_queue_id": "cde6525c-31dd-11e4-a95e-0edbcc4b5058",
  "success": true
}
```

#### Syncing a Connection

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

##### Example

The following example displays how to sync data through an external Snowflake.

###### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "snowflake",
    "connection": {
      "server":"xxx.snowflakecomputing.com",
      "database":"sfdatabase",
      "username":"sfusername",
      "password":"sfpassword"
    },
    "table": "sftable",
    "sql_query": "SELECT * FROM remote_table WHERE value = 1"
  },
  "interval": 2592000
}' "https://{username}.carto.com/api/v1/synchronizations/?api_key={API_KEY}"
```

###### Response

The response includes the following items:

Attributes | Description
--- | ---
endpoint | This item refers to the internal CARTO controller code responsible for performing the connection.
item_queue_id | A unique alphanumeric identifier that refers to the connection process. It can be used to retrieve data related to the created table.
id | An alphanumeric identifier used internally by CARTO as a reference to the connection process.
name | This item is currently deprecated.
interval | An integer value that stores the number of seconds between synchronizations.
state | A string value indicating the current condition of the importing process. It can have any of the following values: **created**,  **queued**, **syncing**, **success** or **failure**.
user_id | A unique alphanumeric identifier to reference the user in the CARTO Engine.
created_at | The date time at which the table was created in the CARTO Engine.
updated_at | The date time at which the table had its contents modified.
run_at | The date time at which the table will get its contents synced with the source file.
ran_at | The date time at which the table **had** its contents synced with the source file.
modified_at | The date time at which the table was manually modified, if applicable.
etag | HTTP entity tag of the source file.
checksum | Same as the **etag** description (HTTP entity tag of the source file).
log_id | A unique alphanumeric identifier to locate the log traces of the given table.
error_code | An integer value representing a unique error identifier.
error_message | A string value indicating the message related to the *error_code* element.
retried_times | An integer value indicating the number of attempts that were performed to sync the table.
service_name | This has the value **connector** for all connector-based synchronizations.
service_item_id | This contains all the parameters defining the connection.
type_guessing | Deprecated (unused for connectors).
content_guessing | Deprecated (unused for connectors).
visualization_id | A unique identifier for the map created in the import process. Only applies if `create_visualization` is set to true.
from_external_source | Has the value **false** for all connector-based synchronizations.

```javascript
{
  "data_import":{
    "endpoint":"/api/v1/imports",
    "item_queue_id":"111c4ee0-7e6a-4cb0-8ba8-b98b9159a6d3"
  },
  "id":"97893fbe-752b-13e6-8543-0401a071da21",
  "name":null,
  "interval":900,
  "url":null,
  "state":"created",
  "user_id":"ca8c6xce-d773-451b-8a43-6c7e2fbdd80e",
  "created_at":"2016-09-07T16:53:24+00:00",
  "updated_at":"2016-09-07T16:53:24+00:00",
  "run_at":"2016-09-07T17:08:24+00:00",
  "ran_at":"2016-09-07T16:53:24+00:00",
  "modified_at":null,
  "etag":null,
  "checksum":"",
  "log_id":null,
  "error_code":null,
  "error_message":null,
  "retried_times":0,
  "service_name":"connector",
  "service_item_id":"{\"provider\":\"snowflake\",\"connection\":{\"server\":\"xxx.snowflakecomputing.com\",\"username\":\"sfusername\",\"password\":\"sfpasswrod\",\"database\":\"sfdatabase\"},\"table\":\"sftable\"}",
  "type_guessing":true,
  "quoted_fields_guessing":true,
  "content_guessing":false,
  "visualization_id":null,
  "from_external_source":false
  }
}
```

#### Geography columns

Snowflake columns of type GEOGRAPHY can be imported as the geometry of the resulting CARTO dataset
(the `the_geom` column). In order to do so, the Snowflake column needs to be converted to WKT format and be name as `the_geom`. You'll need to use a query (`sql_query` parameter) to do so:

```sql
SELECT my_othercolumn, ST_AsWKT(my_geography) AS the_geom FROM my_database.my_schema.my_table
```

**Warning:** There's currently an important limitation with the BETA connector: If your query or table results include any column with a GEOGRAPHY data type not converted through `ST_AsWKT`, the import will fail.

##### Tip: define points by longitude and latitude

In case your Snowflake table specifies geographic locations using longitude and latitude numeric columns, you could import them as geometry by using the BigQuery [ST_MAKEPOINT](https://docs.snowflake.com/en/sql-reference/functions/st_makepoint.html) function to convert them into a GEOGRAPHY like this:

```sql
SELECT my_othercolumn, ST_ASWKT(ST_MAKEPOINT(my_long_column, my_lat_column)) AS the_geom FROM my_database.my_schema.my_table
```

### Limitations and Restrictions

When using database connectors, the following limitations or restrictions are enforced:

- The maximum number of rows that the connector can fetch from the remote table is 1 MILLION rows, 5 MILLION rows for the BigQuery, Snowflake and Redshift connectors. When this limit is reached, a warning will be fired and the dataset will be successfully imported, but truncated to 1 million rows

  **Note:** Lower limits may apply to your particular CARTO account and further restrict your imports or even prevent the connection. [Contact us](mailto:sales@carto.com) if you have questions about account limitations.

- The maximum number of columns for a remote table is 256. Connections will fail if this limit is surpassed
- The number of simultaneous sync tables and concurrent executions is subject to limits, depending on your account plan. [Contact us](sales@carto.com) to discuss support for your connector
- The length of table, column, schema, or identifier names should not be greater than 63 characters. Beyond 63 characters, the identifier is truncated, which could lead to undefined behavior
- Only columns of supported types will be imported. Currently, any of the following that can be assimilated to standard SQL types, are supported:
  - `CHARACTER`
  - `CHARACTER VARYING`
  - `DECIMAL`
  - `NUMERIC`
  - `FLOAT`
  - `REAL`
  - `DOUBLE PRECISION`
  - `INTEGER`
  - `SMALLINT`
  - `BIGINT`
  - `DATE`
  - `TIME`
  - `TIMESTAMP`
- The number of remote listing tables is limited to 500 table names

**Note:** The number of imported columns will affect the performance of the connector.
