CartoDB Editor
==============

The CartoDB editor is located at the `CartoDB/CartoDB <https://github.com/cartodb/cartodb>`_
repository. It is a Ruby on Rails application which takes care of:

  - Creation of users, including creating databases for them and setting them up with 
    PostGIS and the cartodb-postgresql extension.
      - It is also responsible for setting up the metadata for each user in Redis, to enable
        them to use the Maps API and SQL API.
  - Dataset import, based on ogr2ogr (part of the GDAL suite)
  - Synchronized tables (which get updated periodically)
  - Creation, deletion, and handling of tables, serving as a table editor using the SQL API.
  - Visualization creation, using the Maps API and the SQL API
  - Granting and revoking permissions to tables

It has been tested to work with Ruby 1.9.3.
