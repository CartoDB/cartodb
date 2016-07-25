# Setup foreign data wrapper data library import for cartodb-org repo

This doc describes the high-level manual configuration steps necessary in a cartodb instance to setup
foreign data wrapper based data library imports. Some examples of commands to run to get the necessary
info are provided for reference, but will likely need to be modified based on your particular setup.

### Terminology

Remote server/database: The cartodb instance that hosts the commondata account that your
cartodb instance will be connecting to
Local server/database: Your cartodb instance, that holds all of your users and data.

### Setup

Once you have a remote cartodb instance and your local cartodb instance setup with the cartodb-org
codebase, you'll need to do the following to finish up configuration of the remote data library
foreign data wrappers:

1. Get the database name and schema of the remote cartodb commondata account, e.g.
```
sudo -u postgres psql -d carto_db_development -c "select id, database_name, database_schema from users where username='commondata'";
```

2. Add an `fdwuser` user to the remote cartodb instance
```
sudo -u postgres psql -d "<dbnamefromstep1>" -c "CREATE USER fdwuser WITH ENCRYPTED PASSWORD 'asecurepassword'"
```

3. Add the new `fdwuser` to the common data cartodb user role so it mirrors its permissions, e.g.
```
sudo -u postgres psql -d "<dbnamefromstep1>" -c "GRANT \"development_cartodb_user_<idfromstep1>\" TO fdwuser"
```

4. Update your local instance's `app_config.yml` to include the proper connection parameters to
the remote cartodb instance:
```
# This config must be added at the top level of the config, and a good place for it is
# right after the common_data block.
  fdw:
    host: 'IP address of remote cartodb instance'
    port: 5432
    database: '<database name from step 1>'
    username: 'fdwuser'
    password: '<passwordyoucreatedinstep2>'
```

5. Add an appropriate fdwuser entry to your postgresql pg_hba.conf so that the fdwuser is forced
to connect via `md5`

6. If in development, update the postgresql.conf listen_addresses config option to be `localhost,192.168.20.100`

7. Restart postgresql, then all cartodb services (web, resque, sqlapi, windshaft)
