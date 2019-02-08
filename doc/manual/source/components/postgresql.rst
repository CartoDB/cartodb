PostgreSQL
----------

`PostgreSQL <http://postgresql.org>`_ is the open source database powering CARTO.

CARTO uses PostgreSQL for two purposes:

* **Metadata storage**. This is the metadata used by the CARTO Builder. Builder models like users information, visualizations, or other metadata is stored in this database. The name and connection information of this database is specified on the Rails ``app_config.yml`` configuration file.

* **User data storage**. Each single user or organization in CARTO has a individual PostgreSQL database. This database is created during the user signup process. Its database name and connection info is generated on the fly by the CARTO application during this process. Both values are stored within the user info in the metadata database. Every user database name contains the user UUID.

Both metadata database and users databases can be hosted either in the same PostgreSQL cluster or different ones. Having both the in the same cluster is the recommended approach for small environments.
Builder only knows how to connect to metadata database. However, within every request it checks the connection info of the user database which is stored in metadata database, as described before.

At this moment CARTO requires PostgreSQL 10 version.

.. _postgis_label:

PostGIS
-------
`PostGIS <http://postgis.net>`_ is the extension which adds spatial capabilities to PostgreSQL.
It allows working with geospatial types or running geospatial functions in PostgreSQL.
Is is required both on the user data clusters and the metadata cluster.

At this moment CARTO requires PostGIS version 2.4.
