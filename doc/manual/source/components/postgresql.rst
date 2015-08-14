PostgreSQL
----------
PostgreSQL (http://postgresql.org) is the open source database powering CartoDB.
We use PostgreSQL for two purposes:
  - Metadata storage: storing users, visualizations, and other metadata used by the
    Rails application. The name and connection information of this database is 
    specified on the Rails ``app_config.yml`` configuration file.
  - User data storage: each user has its own database, which is created on the fly by
    the CartoDB application during signup. Its database name and connection info is
    generated on the fly by the CartoDB application, depending on the user ID, specified
    database host, and environment information.

The application is architectured to allow both databases to be hosted on separate
PostgreSQL cluster (which is fine for a small environment) or in separate ones.
Each user has a ``database_host`` field, which determines where it is located.

PostGIS
-------
PostGIS <http://postgis.net> is the extension which adds spatial capabilities to PostgreSQL.
Is is required both on the user data clusters and the metadata cluster.

At least PostGIS version 2.1.5 needs to be installed on the database servers.


