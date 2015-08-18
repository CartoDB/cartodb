CartoDB PostgreSQL extension
----------------------------
The CartoDB PostgreSQL extension can be found at https://github.com/CartoDB/cartodb-postgresql.

This extensions is required by all the components of CartoDB and it must be installed in the server where user databases are stored.

It provides functions and other helpers needed by the Editor, Maps and SQL APIs like:
  
  - CartoDBfying functions which convert raw PostgreSQL tables in tables recognized by CartoDB by adding some additional columns and triggers
  - Multiuser schema handling functions
  - Quota helpers
  - Cache helpers
  - ...

The CartoDB extension depends on :ref:`PostGIS` and on the `pg_schema_triggers <https://github.com/CartoDB/pg_schema_triggers>`_ extension.
