CARTO PostgreSQL extension
--------------------------
CARTO's PostgreSQL extension can be found at https://github.com/CartoDB/cartodb-postgresql.

This extensions is required by all the components of CARTO and it must be installed in the server where user databases are stored.

It provides functions and other helpers needed by Builder, Maps and SQL APIs like:

  - CartoDBfying functions which convert raw PostgreSQL tables in tables recognized by CARTO by adding some additional columns and triggers
  - Multiuser schema handling functions
  - Quota helpers
  - Cache helpers
  - etc..

The CARTO extension depends on :ref:`postgis_label`.
