# Redis #

## List of Redis Databases ##

The databases used by CartoDB are:

  - **0 - tables_metadata**: stores metadata from cartodb tables
  - **3 - api_credentials**: stores the credentials to access to CartoDB via API. This credentials are OAuth validated tokens and API keys
  - **5 - users_metadata**: stores metadata about the users account and database
  
### tables_metadata database ###

`tables_metadata` database stores metadata from the user tables. This metadata can be the privacy of the table, the owner identifier, the schema, and so on. 

The database is structured in hashes. The key of each hash has the following format:

```
rails:<database_name>:<table_name>
```

The values of the hash are:

  - `the_geom_type`: the geometry type. Example: `point`
  - `infowindow`: the CSV string of values to use in the infowindow SQL. eg. 'id, name, description'. Should be suitable for passing to the CartoDB API
  - `privacy`: the privacy of the table. 0 means **private** and 1 means **public**
  - `user_id`: the identifier of the owner

### api_credentials ###

`api_credentials` database stores a list of credentials which can be used to be authenticated via the API. The database is organized in hashes. Each hash is identified by this format of key:

```
rails:oauth_tokens:<token>
```

The values of the hash are:

  - `user_id`: the identifier of the user which is associated to the token
  - `time`: the time which the token was created

### users_metadata ###

`users_metadata` Holds records of the username/subdomain to id and name of database so that we can easily go from their subdomain to their user database. The following keys are used:

```
rails:users:<username/subdomain> 
```

The values of the hash are:

  - `id`: user id on the metadata database
  - `database_name`: name of the user database
  - `map_key`: api key
  - `mapviews`: hash with this values:
    - `global`: sorted set of map views, the key for this sorted set is `%Y%m%d`
    - `stat_tag:<visualization_id>`: sorted set of map views for a given visualization
  - `api_calls`: array of aggregated map views for the last 30 days
  - `last_active_time`: last time the user loaded their dashboard

