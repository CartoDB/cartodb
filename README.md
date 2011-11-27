# What is CartoDB? #

CartoDB is an open source tool that allows for the storage and visualization of geospatial data on the web. 

It was built to make it easier for people to tell their stories by providing them with flexible and intuitive ways to create maps and design geospatial applications. CartoDB can be installed on your own server and we also offer a hosted service at [cartodb.com](http://cartodb.com). 

If you would like to see some live demos, check out our [videos](http://www.vimeo.com/channels/cartodb) on Vimeo. We hope you like it!

<img src="http://i.imgur.com/wa3yG.jpg" width="100%"/>

# What can I do with CartoDB? #

With CartoDB, you can upload your geospatial data (Shapefiles, GeoJSON, etc) using a web form and then make it public or private. 

After it is uploaded, you can visualize it in a table or on a map, search it using SQL, and apply map styles using CartoCSS. You can even access it using the CartoDB Maps API and SQL API, or export it to a file. 

In other words, with CartoDB you can make awesome maps and build powerful geospatial applications! 

# What are the components of CartoDB? #

  - A User Interface for uploading, creating, editing, visualizing, and exporting geospatial data.
  - A geospatial database built on PostgreSQL and PostGIS 2.0
  - An SQL API for running SQL queries over HTTP with results formatted using GeoJSON and KML
  - A Map tiler that supports SQL and tile styling using CartoCSS 
  - Authentication using OAuth if required  
 
# What does CartoDB depend on? #

  - CartoDB-SQL-API  
  - Mapnik 2.0
  - NodeJS 0.4.10+
  - PostGIS 2.0
  - Postgres 9.1.x
  - Redis 2.2+
  - Ruby 1.9.2+
  - Windshaft-cartodb
  
# How do I install CartoDB? #

The installation process is fairly painless, and we have successful installations running on Amazon EC2, Linode, and development machines with OS X and Ubuntu. 

Before getting started, go ahead and download CartoDB by cloning this repository:

```shell
git clone https://github.com/Vizzuality/cartodb.git

```

Or you can just [download the CartoDB zip file](https://github.com/Vizzuality/cartodb/zipball/master).

## Install Ruby ##

We implemented CartoDB in the [Ruby](ruby-lang.org) programming language, so you'll need to install Ruby 1.9.2+.

## Install Node.js ##

Components of CartoDB, like Windshaft, depend on [Node.js](nodejs.org). Basically it's a highly-scalable web server that leverages Google's V8 JavaScript engine. 

You can install Node.js and NPM (the Node.js package manager) by [following these instructions](https://github.com/joyent/node/wiki/Installation) on Node's GitHub wiki site. 

Alternatively, you can install Node.js using `brew install node`, but NPM has to be installed using the wiki instructions above.

## Install PostgreSQL and PostGIS ##

[PostgreSQL](http://www.postgresql.org) is the relational database that powers CartoDB. [PostGIS](http://postgis.refractions.net) is the geospatial extension that allows PostgreSQL to support geospatial queries. This is the heart of CartoDB!

First you'll need to install a few dependencies. 

  - [GDAL](http://www.gdal.org) is requires for raster support.
  - [GEOS](http://trac.osgeo.org/geos) is required for geometry function support.
  - [JSON-C](http://oss.metaparadigm.com/json-c) is required for GeoJSON support.
  - [PROJ4](http://trac.osgeo.org/proj) is required for reprojection support.
  - plpython is required for Python support (e.g., `sudo apt-get install postgresql-plpython-9.1`)

 
Next install PostgreSQL 9.1.x and PostGIS 2.0.x.

Finally, CartoDB depends on a geospatial database template named `template_postgis`. In the example script below, make sure that the path to each SQL file is correct. As of PostGIS r8242 for example, spatial_ref_sys.sql is now located in the `root` installation directory, instead of in the `./postgis` directory:

```bash
#!/usr/bin/env bash
POSTGIS_SQL_PATH='pg_config --sharedir'/contrib/postgis-2.0
createdb -E UTF8 template_postgis 
createlang -d template_postgis plpgsql 
psql -d postgres -c "UPDATE pg_database SET datistemplate='true' WHERE datname='template_postgis';"
psql -d template_postgis -f $POSTGIS_SQL_PATH/postgis.sql 
psql -d template_postgis -f $POSTGIS_SQL_PATH/spatial_ref_sys.sql
psql -d template_postgis -f $POSTGIS_SQL_PATH/legacy.sql
psql -d template_postgis -f $POSTGIS_SQL_PATH/legacy_compatibility_layer.sql
psql -d template_postgis -c "GRANT ALL ON geometry_columns TO PUBLIC;" 
psql -d template_postgis -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"
```

  - Install Redis from <http://redis.io/download> or using `brew install redis`.
  
  - Python dependencies: 
    
      easy_install pip  # in MacOs X
      pip install -r python_requirements.txt
      
      Note: If compilation fails (it did for gdal module raising a Broken pipe error) try doing "export ARCHFLAGS='-arch i386 -arch x86_64'" first

  - Setup new hosts in `/etc/hosts`:
      
        # CartoDB
        127.0.0.1 admin.localhost.lan admin.testhost.lan
        127.0.0.1 my_subdomain.localhost.lan
        # # # # #
                
  - Clone the [Node SQL API](https://github.com/tokumine/cartodb-sql-api) in your projects folder:
  
        git clone git@github.com:Vizzuality/CartoDB-SQL-API.git

  - Install nodejs dependencies
    
        npm install

  - Clone the [map tiler](https://github.com/Vizzuality/Windshaft-cartodb) in your projects folder:

        git clone git@github.com:Vizzuality/Windshaft-cartodb.git

  - Install nodejs dependencies

        npm install
  
  - Clone the CartoDB repository in your projects folder:
  
        git clone git@github.com:Vizzuality/cartodb.git
        
  - Change to cartodb/ folder and `rvm` will require to create a new gemset. Say **yes**. If not, you must create a `gemset` for Ruby 1.9.2:
  
        rvm use 1.9.2@cartodb --create
        
  - Run `bundle`:
  
        bundle install --binstubs
        
  - Run Redis:
  
        cd /tmp
        redis-server
  
  - Run `rake cartodb:db:setup EMAIL=me@mail.com SUBDOMAIN=my_subdomain PASSWORD=my_pass ADMIN_PASSWORD=my_pass` in cartodb folder
  
  - This will configure 2 users. The admin user (admin) and a user of your own.  After spinning up all your processes (cartodb, sql api, tiler), you should be able to login.
  

### Every day usage ###
  
  - Check if Redis is running, if not `cd /tmp; redis-server`

  - Change to CartoDB directory
  
  - Run `bin/rake db:reset` if you want to reset your data and load the database from `seeds.rb` file
  
  - Run a Rails server in port 3000: `rails s`
  
  - In a separate tab change to Node SQL API and Tiler directories and run node.js: `node app.js developement`

  - Open your browser and go to `http://admin.localhost.lan:3000` or `http://my_subdomain.localhost.lan:3000`_
  
  - Enjoy!
  


### Contributors by commits###

  - Fernando Blat (@ferblape)
  - Javier Alvarez (@xavijam)
  - Simon Tokumine (@tokumine)
  - Javier Álvarez Medina (@xavijam)
  - Alvaro Bautista (@batu)
  - Fernando Espinosa (@ferdev)
  - Sergio Alvarez Leiva (@saleiva)
  - Javier de la Torre (@jatorre)
  - Andrew W Hill (@andrewxhill)
  - Javier Arce (@javierarce)
  - Aaron Steele (@eightysteele)