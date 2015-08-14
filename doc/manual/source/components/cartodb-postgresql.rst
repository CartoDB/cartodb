cartodb-postgresql extension
----------------------------
The CartoDB-postgresql extension can be found at https://github.com/CartoDB/cartodb-postgresql.
It needs to be installed on the PostgreSQL clusters which will host user databases and
includes most of the triggers and functions used by the CartoDB applications such as:
  - CartoDBfying (adapting user tables to the schema CartoDB expects them to have, by adding
    some additional columns and triggers)
  - Multiuser schema handling
  - Quota handling
  - Cache helpers

The CartoDB extension depends on :ref:`PostGIS` and on the `pg_schema_triggers <https://github.com/CartoDB/pg_schema_triggers>`_
extension.
