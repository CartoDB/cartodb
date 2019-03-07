## Database Connectors

Typically when you import data, you are fetching a file or layer of data and importing it into a table. CARTO creates and formats the default columns and indexes during the import process.

Alternatively, you can use the Import API to connect to an external database. Your data from the external database is cached into a CARTO table by using the `connector` parameters.

There are several types of database connectors that you can activate to your CARTO account.

### The MySQL Connector

The MySQL Connector allows you to import data into a CARTO account as tables from a MySQL database. Note that **this connector is disabled by default** in the CARTO importer options. If you are interested in enabling it, [contact us](mailto:sales@carto.com) for details.

You can use the MySQL Connector to:

- Import a single, whole table stored in your MySQL database
- Apply a SQL query to import filtered data
- Apply a SQL query from from multiple joined tables

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

#### Syncing Connections

If your CARTO plan includes Sync Tables, you can create a sync table from a database connector by applying the `interval` parameter, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync_tables/)  for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period. *Note*: Sync interval must be at least 900 (15 minutes).

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

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
  },
  "interval": 2592000
}
```

#### Connect to a Table

In order to connect to an external MySQL database table, the following rules apply:

- The name of the remote MySQL table must be passed in the `connector`/`table` parameter
- The `sql_query` parameter must not be present
- A CARTO dataset with the same name will be connected to the external table

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

The `table` parameter must also be used to define the name of the local table. This table stores the data of the remote table. This is the dataset that will be created in your CARTO account.

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
    "table": "mytable",
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
    "table": "mytable",
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

Both tables and queries can be synchronized periodically by using the `interval` parameter, which
defines the number of seconds for the synchronization period.

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
    "table": "mytable",
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

The PostgreSQL Connector allows you to import data into a CARTO account as tables from a PostgreSQL database. Note that **this connector is disabled by default** in the CARTO importer options. If you are interested in enabling it, [contact us](mailto:sales@carto.com) for details.

You can use the PostgreSQL Connector to:

- Import a single, whole table stored in your PostgreSQL database
- Apply a SQL query to import filtered data
- Apply a SQL query from from multiple joined tables

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

#### Syncing Connections

If your CARTO plan includes Sync Tables, you can create a sync table from a database connector by applying the `interval` parameter, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period. _The Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

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
    "table": "pgtable"
  },
  "interval": 2592000
}
```

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

Both tables and queries can be synchronized periodically by using the `interval` parameter, which
defines the number of seconds for the synchronization period.

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
    "table": "pgtable"
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

The Microsoft SQL Server Connector allows you to import data into a CARTO account as tables from a Microsoft SQL Server database. Note that **this connector is disabled by default** in the CARTO importer options. If you are interested in enabling it, [contact us](mailto:sales@carto.com) for details.

You can use the Microsoft SQL Server Connector to:

- Import a single, whole table stored in your Microsoft SQL Server database
- Apply a SQL query to import filtered data
- Apply a SQL query from from multiple joined tables

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

#### Syncing Connections

If your CARTO plan includes Sync Tables, you can create a sync table from a database connector by applying the `interval` parameter, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period._Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

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
    "table": "mstable"
  },
  "interval": 2592000
}
```

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

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period.

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
    "table": "mstable"
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

### The Hive Connector

The Hive Connector allows you to import data into a CARTO account as tables from a HiveServer2 database. Note that **this connector is disabled by default** in the CARTO importer options. If you are interested in enabling it, [contact us](mailto:sales@carto.com) for details.

You can use the Hive Connector to:

- Import a single, whole table stored in your Hive database
- Apply a SQL query to import filtered data
- Apply a SQL query from from multiple joined tables

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

#### Syncing Connections

If your CARTO plan includes Sync Tables, you can create a sync table from a database connector by applying the `interval` parameter, similar to how you would use other [Sync Tables]({{site.importapi_docs}}/guides/sync-tables/) for your data.

Param | Description
--- | ---
interval | The number of seconds for the synchronization period. _Sync interval must be at least 900 (15 minutes)._

**Note:** The the `interval` parameter is **not** within the `connector` attributes, it appears as a separate parameter:

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
    "table": "hs2table"
  },
  "interval": 2592000
}
```

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

Both tables and queries can be synchronized periodically by using the `interval` parameter, which defines the number of seconds for the synchronization period.

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
    "table": "hs2table"
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

### Limitations and Restrictions

When using database connectors, the following limitations or restrictions are enforced:

- The maximum number of rows that the connector can fetch from the remote table is 1 MILLION rows. When this limit is reached, a warning will be fired and the dataset will be successfully imported, but truncated to 1 million rows

  **Note:** A lower number of row limits, per import, may apply to your CARTO account a prevent the connection. [Contact us](mailto:sales@carto.com) if you have questions about account limitations.

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
