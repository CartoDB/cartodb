**Warning:** Federated Tables is in **BETA** stage and the API might change or have limited support.


## Quickstart

In order to manage Federated Tables as part of the CARTO platform, we provide a RESTful Web Service to manipulate the resources that represent Federated Tables by using a uniform and predefined set of operations.

For this example (and the rest of the ones illustrated here) we will be using a command-line tool known as `cURL`. For more info about this tool see [this blog post](http://quickleft.com/blog/command-line-tutorials-curl) or type `man curl` in bash.

We will be using the following authentication parameters in the examples:

Param | Value | Description
--- | --- | ---
username | `documentation` | The CARTO account username.
api_key | `bec1667cdedaa6fd70165f5099981d0c61ec1112` | The target CARTO account [API key](https://carto.com/developers/fundamentals/authorization/#api-keys). Used only for illustration purposes.


### Registering a new Federated Server

The Federated Server handles the information about the remote database, that is its address and authentication values so CARTO can gain access to it.

We are registering a server called `example_server` that we will reuse in other examples as part of their urls.

#### Call

```bash
curl -X POST -H "Content-Type: application/json" "https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112" -d '{
    "federated_server_name": "example_server",
    "mode": "read-only",
    "dbname": "geometries",
    "host": "example.com",
    "port": "5432",
    "username": "remote_user",
    "password": "remote_password"
}'
```

#### Response

```
{
   "federated_server_name": "example_server",
   "mode": "read-only",
   "dbname": "geometries",
   "host": "example.com",
   "port": "5432",
   "username": "remote_user",
   "password": "*****"
}
```

### List all existing Federated Servers

This endpoint allows you to access the information of all registered servers accesible by the caller.

#### Call

```bash
curl -X GET "https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

```
{
   "total": 2,
   "count": 2,
   "result":[
      {
         "federated_server_name": "example_server",
         "mode": "read-only",
         "dbname": "geometries",
         "host": "example.com",
         "port": "5432",
         "username": "remote_user",
         "password": "*****"
      },
      {
         "federated_server_name": "test002",
         "mode": "read-only",
         "dbname": "wharehouse",
         "host": "example.edu",
         "port": "5432",
         "username": "cartofante",
         "password": "*****"
      }
   ],
   "_links":{
      "first":{
         "href": "https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026format=json\u0026page=1\u0026per_page=20"
      },
      "last":{
         "href": "https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026format=json\u0026page=1\u0026per_page=20"
      }
   }
}
```

### List a single Federated Server

This endpoint returns the configuration of a single server that matches the `example_server` name.

#### Call

```bash
curl -X GET "https://documentation.carto.com/api/v4/federated_servers/example_server?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

```
{
   "federated_server_name": "example_server",
   "mode": "read-only",
   "dbname": "geometries",
   "host": "example.com",
   "port": "5432",
   "username": "remote_user",
   "password": "*****"
}
```

### Modify a single Federated Server

This endpoint allows the modification of an already registered server. If the server didn't already exist it will create it.

#### Call

```bash
curl -X PUT -H "Content-Type: application/json" "https://documentation.carto.com/api/v4/federated_servers/example_server?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112" -d '{
    "mode": "read-only",
    "dbname": "geometries",
    "host": "example.com",
    "port": "5432",
    "username": "new_user",
    "password": "new_password"
}'
```

#### Response

The reponse has no extra content. The new configuration is accessible using the already mentioned endpoints.

### Unregister a Federated Server

This endpoint will remove a registered servers and all the tables created through it.

#### Call

```bash
curl -X DELETE "https://documentation.carto.com/api/v4/federated_servers/example_server?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

The reponse has no extra content.


### List remote schemas

Once we have a server registered, we can check what information is available to us (via the provided PostgreSQL user), so first we'll list the available schemas:

#### Call

```bash
curl -X GET "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

```
{
   "total": 3,
   "count": 3,
   "result":[
      {
         "remote_schema_name":"information_schema"
      },
      {
         "remote_schema_name":"public"
      },
      {
         "remote_schema_name":"borders"
      }
   ],
   "_links":{
      "first":{
         "href":"https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026federated_server_name=example_server\u0026format=json\u0026page=1\u0026per_page=20"
      },
      "last":{
         "href":"https://documentation.carto.com/api/v4/federated_servers?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026federated_server_name=example_server\u0026format=json\u0026page=1\u0026per_page=20"
      }
   }
}
```

### List all remote tables whitin a remote schema

Once we know which schema we want to check, we can list what are the available tables and their columns so we can register them as a Federated Table. In this case we'll list the schema `borders`:

#### Call

```bash
curl -X GET "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/borders/remote_tables/?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

```
{
   "total": 2,
   "count": 2,
   "result":[
      {
         "registered": false,
         "remote_schema_name": "borders",
         "remote_table_name": "pref",
         "columns": [
            { Name: 'area', Type: 'double precision' },
            { Name: 'area_bill', Type: 'double precision' },
            { Name: 'area_contents', Type: 'double precision' },
            { Name: 'area_pop', Type: 'double precision' },
            { Name: 'area_youto', Type: 'double precision' },
            { Name: 'cartodb_id', Type: 'integer' },
            { Name: 'gid', Type: 'integer' },
            { Name: 'pref', Type: 'text' },
            { Name: 'prefcode', Type: 'integer' },
            { Name: 'the_geom', Type: 'GEOMETRY,4326' },
            { Name: 'the_geom_webmercator', Type: 'GEOMETRY,3857' }
         ]
      },
      {
         "registered": false,
         "remote_schema_name": "borders",
         "remote_table_name": "world_borders",
         "columns": [
            { Name: 'area', Type: 'integer' },
            { Name: 'cartodb_id', Type: 'integer' },
            { Name: 'created_at', Type: 'timestamp with time zone' },
            { Name: 'fips', Type: 'text' },
            { Name: 'iso2', Type: 'text' },
            { Name: 'iso3', Type: 'text' },
            { Name: 'lat', Type: 'double precision' },
            { Name: 'lon', Type: 'double precision' },
            { Name: 'name', Type: 'text' },
            { Name: 'pop2005', Type: 'integer' },
            { Name: 'region', Type: 'integer' },
            { Name: 'subregion', Type: 'integer' },
            { Name: 'the_geom', Type: 'GEOMETRY,4326' },
            { Name: 'the_geom_str', Type: 'text' },
            { Name: 'the_geom_webmercator', Type: 'GEOMETRY,3857' },
            { Name: 'un', Type: 'integer' },
            { Name: 'updated_at', Type: 'timestamp with time zone' }
         ]
      }
   ],
   "_links":{
      "first":{
         "href":"https://documentation.carto.com/api/v4/federated_servers/?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026federated_server_name=example_server\u0026format=json\u0026page=1\u0026per_page=20\u0026remote_schema_name=borders"
      },
      "last":{
         "href":"https://documentation.carto.com/api/v4/federated_servers/?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112\u0026federated_server_name=example_server\u0026format=json\u0026page=1\u0026per_page=20\u0026remote_schema_name=borders"
      }
   }
}
```

### List a single remote table

If we want to see (or register with a PUT) a single remote table, we can use this endpoint:

#### Call

```bash
curl -X GET "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/borders/remote_tables/pref?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

```
{
   "registered": false,
   "remote_table_name": "pref",
   "remote_schema_name": "borders",
   "columns": [
      { Name: 'area', Type: 'double precision' },
      { Name: 'area_bill', Type: 'double precision' },
      { Name: 'area_contents', Type: 'double precision' },
      { Name: 'area_pop', Type: 'double precision' },
      { Name: 'area_youto', Type: 'double precision' },
      { Name: 'cartodb_id', Type: 'integer' },
      { Name: 'gid', Type: 'integer' },
      { Name: 'pref', Type: 'text' },
      { Name: 'prefcode', Type: 'integer' },
      { Name: 'the_geom', Type: 'GEOMETRY,4326' },
      { Name: 'the_geom_webmercator', Type: 'GEOMETRY,3857' }
   ]
}
```

### Registering a new Federated Table

In the previous call we could see the tables available to register; and with this endpoint we can register one of them so it's available in the CARTO platform.

#### Call

```bash
curl -X POST -H "Content-Type: application/json" "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/borders/remote_tables/?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112" -d '{
    "remote_table_name": "world_borders",
    "id_column_name": "cartodb_id",
    "geom_column_name": "the_geom",
    "webmercator_column_name": "the_geom_webmercator"
}'
```

#### Response

In this reponse, we can already see the `qualified_name` parameter, which can be used whithin CARTO to use this table.

```
{
   "registered": true,
   "qualified_name": "cdb_fs_example_server.world_borders",
   "remote_table_name": "world_borders",
   "remote_schema_name": "borders",
   "id_column_name": "cartodb_id",
   "geom_column_name": "the_geom",
   "webmercator_column_name": "the_geom_webmercator",
   "columns": [
      { Name: 'area', Type: 'integer' },
      { Name: 'cartodb_id', Type: 'integer' },
      { Name: 'created_at', Type: 'timestamp with time zone' },
      { Name: 'fips', Type: 'text' },
      { Name: 'iso2', Type: 'text' },
      { Name: 'iso3', Type: 'text' },
      { Name: 'lat', Type: 'double precision' },
      { Name: 'lon', Type: 'double precision' },
      { Name: 'name', Type: 'text' },
      { Name: 'pop2005', Type: 'integer' },
      { Name: 'region', Type: 'integer' },
      { Name: 'subregion', Type: 'integer' },
      { Name: 'the_geom', Type: 'GEOMETRY,4326' },
      { Name: 'the_geom_str', Type: 'text' },
      { Name: 'the_geom_webmercator', Type: 'GEOMETRY,3857' },
      { Name: 'un', Type: 'integer' },
      { Name: 'updated_at', Type: 'timestamp with time zone' }
   ]
}
```


### Modify a registered Federated Table

This endpoint allows the modification of an already registered table. If it wasn't already, the table will be registered.

#### Call

```bash
curl -X PUT -H "Content-Type: application/json" "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/borders/remote_tables/world_borders?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112" -d '{
    "id_column_name": "cartodb_id",
    "geom_column_name": "the_geom",
    "webmercator_column_name": "the_geom_webmercator"
}'
```

#### Response

```
{
   "registered": true,
   "qualified_name": "cdb_fs_example_server.world_borders",
   "remote_table_name": "world_borders",
   "remote_schema_name": "borders",
   "id_column_name": "cartodb_id",
   "geom_column_name": "the_geom",
   "webmercator_column_name": "the_geom_webmercator",
   "columns": [
      { Name: 'area', Type: 'integer' },
      { Name: 'cartodb_id', Type: 'integer' },
      { Name: 'created_at', Type: 'timestamp with time zone' },
      { Name: 'fips', Type: 'text' },
      { Name: 'iso2', Type: 'text' },
      { Name: 'iso3', Type: 'text' },
      { Name: 'lat', Type: 'double precision' },
      { Name: 'lon', Type: 'double precision' },
      { Name: 'name', Type: 'text' },
      { Name: 'pop2005', Type: 'integer' },
      { Name: 'region', Type: 'integer' },
      { Name: 'subregion', Type: 'integer' },
      { Name: 'the_geom', Type: 'GEOMETRY,4326' },
      { Name: 'the_geom_str', Type: 'text' },
      { Name: 'the_geom_webmercator', Type: 'GEOMETRY,3857' },
      { Name: 'un', Type: 'integer' },
      { Name: 'updated_at', Type: 'timestamp with time zone' }
   ]
}
```


### Unregister a Federated Table

This endpoint will unregister a table, which means that it won't be usable inside CARTO. This will also remove any dependent objects, but it won't do any change in the remote table, which could be registered again.

#### Call

```bash
curl -X DELETE -H "https://documentation.carto.com/api/v4/federated_servers/example_server/remote_schemas/borders/remote_tables/world_borders?api_key=bec1667cdedaa6fd70165f5099981d0c61ec1112"
```

#### Response

The reponse has no extra content.
