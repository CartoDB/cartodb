Redis
-----

Redis is a key-value store engine used by most components of the CARTO application stack to store configuration and cache.

In contrast to the PostgreSQL metadata (which is used only by the CARTO Builder), the metadata stored in Redis is shared among Builder, the SQL API, and the Maps API.

.. important::
  Even though also used as a cache, there is also persistent data stored in Redis.
  In some environments Redis is configured by default to act without persistency
  (see http://redis.io/topics/persistence).

  You must ensure Redis is configured properly to keep its data between restarts.

Data is stored in separate databases inside this Redis:
 - Database 0: Table and visualization metadata, including map styles and named maps.
 - Database 3: OAuth credentials metadata.
 - Database 5: Metadata about the users, including API keys and database_hosts.
 - Database 8: Rate limits.


At this moment CARTO requires Redis version 4.0 or newer with the `redis-cell` extension.
