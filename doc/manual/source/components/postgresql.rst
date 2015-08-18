PostgreSQL
----------

PostgreSQL (http://postgresql.org) is the open source database powering CartoDB.

We use PostgreSQL for two purposes:

* **Metadata storage**. This is the metadata used by the CartoDB editor. Editor models like users information, visualizations, or other metadata is stored in this database. The name and connection information of this database is specified on the Rails ``app_config.yml`` configuration file.

* **User data storage**. Each single user or organization in CartoDB has a individual PostgreSQL database. This database is created during the user signup process. Its database name and connection info is generated on the fly by the CartoDB application during this process. Both values are stored within the user info in the metadata database. Every user database name contains the user UUID.

Both metadata database and users databases can be hosted either in the same PostgreSQL cluster or different ones. Having both the in the same cluster is the recommended approach for small environments.
The editor only knows how to connect to metadata database. However, within every request it checks the connection info of the user database which is stored in metadata database, as described before.

PostGIS
-------
PostGIS <http://postgis.net> is the extension which adds spatial capabilities to PostgreSQL.
Is is required both on the user data clusters and the metadata cluster.

At least PostGIS version 2.1.5 needs to be installed on the database servers.
