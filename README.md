# What is CartoDB? #

CartoDB is an open source tool that allows for the storage and
visualization of geospatial data on the web.

It was built to make it easier for people to tell their stories by
providing them with flexible and intuitive ways to create maps and design
geospatial applications. CartoDB can be installed on your own server
and we also offer a hosted service at [cartodb.com](http://cartodb.com).

If you would like to see some live demos, check out our
[videos](http://www.vimeo.com/channels/cartodb) on Vimeo.
We hope you like it!

<img src="http://dl.dropbox.com/u/193220/CartoDB/bus_map.jpg" width="900px"/>

<img src="http://dl.dropbox.com/u/193220/CartoDB/bus_table.png" width="900px"/>


# What can I do with CartoDB? #

With CartoDB, you can upload your geospatial data (Shapefiles, GeoJSON,
etc) using a web form and then make it public or private.

After it is uploaded, you can visualize it in a table or on a map, search
it using SQL, and apply map styles using CartoCSS. You can even access it
using the CartoDB [Maps API](http://developers.cartodb.com/api/maps.html)
and [SQL API](http://developers.cartodb.com/api/sql.html), or export it
to a file.

In other words, with CartoDB you can make awesome maps and build
powerful geospatial applications! Definitely check out the [CartoDB
Gallery](http://developers.cartodb.com/gallery) for interactive examples
and code.

# What are the components of CartoDB? #

  - A User Interface for uploading, creating, editing, visualizing,
    and exporting geospatial data.
  - A geospatial database built on PostgreSQL and PostGIS 2.0
  - An SQL API for running SQL queries over HTTP with results formatted
    using GeoJSON and KML
  - A Map tiler that supports SQL and tile styling using CartoCSS
  - Authentication using OAuth if required

# What does CartoDB depend on? #

  - CartoDB-SQL-API
  - Mapnik 2.0
  - NodeJS 0.4.10+
  - PostGIS 2.0
  - Postgres 9.1.x
  - Redis 2.2+
  - Varnish 3.0+
  - Ruby 1.9.2+
  - Windshaft-cartodb

# How do I install CartoDB? #

CartoDB is under heavy development, so the installation process is only
for hardy souls.
That said, there are many successful installations on Amazon EC2, Linode,
dedicated instances and development machines running OS X and Ubuntu 10.04+.

If you want to give it a try, download CartoDB by cloning this repository:

```bash
$ git clone https://github.com/Vizzuality/cartodb.git
```

Or you can just [download the CartoDB zip
file](https://github.com/Vizzuality/cartodb/zipball/master).

## Install Ruby ##

We implemented CartoDB in the [Ruby](http://ruby-lang.org) programming language,
so you'll need to install Ruby 1.9.2+.

  - unp is required for archive file upload support (e.g., `sudo apt-get install unp`)
    
## Install Node.js ##

Components of CartoDB, like Windshaft, depend on [Node.js](http://nodejs.org)
(version greater than or equal to 0.4.1 but less than version
0.5.0). 

You can install Node.js and NPM (the
Node.js package manager) by [following these
instructions](https://github.com/joyent/node/wiki/Installation) on Node's
GitHub wiki site.

Alternatively, you can install Node.js using `brew install node`, but
NPM has to be installed using the wiki instructions above.

** WARNING. CartoDB only supports node 0.4.x at this time. master npm no longer 
supports this version of node so you will need to manually install the correct 
version of npm. We're updating our packages to hit node 0.6, but in the meantime 
recommend you use the nvm (node version manager) to install the 0.4.11 version of nodejs 
CartoDB needs.**

## Install PostgreSQL and PostGIS ##

[PostgreSQL](http://www.postgresql.org) is the relational database
that powers CartoDB. [PostGIS](http://postgis.refractions.net) is
the geospatial extension that allows PostgreSQL to support geospatial
queries. This is the heart of CartoDB!

First you'll need to install a few dependencies.

  - [GDAL](http://www.gdal.org) is requires for raster support.
  - [GEOS](http://trac.osgeo.org/geos) is required for geometry function
    support.
  - [JSON-C](http://oss.metaparadigm.com/json-c) is required for GeoJSON
    support.
  - [PROJ4](http://trac.osgeo.org/proj) is required for reprojection support.
  - plpython is required for Python support (e.g., `sudo apt-get install
    postgresql-plpython-9.1`)

Next install PostgreSQL 9.1.x and PostGIS 2.0.x.

Finally, CartoDB depends on a geospatial database template named
`template_postgis`. In the example script below, make sure that the
path to each SQL file is correct:

```bash
#!/usr/bin/env bash
POSTGIS_SQL_PATH='pg_config --sharedir'/contrib/postgis-2.0
createdb -E UTF8 template_postgis
createlang -d template_postgis plpgsql
psql -d postgres -c \
 "UPDATE pg_database SET datistemplate='true' WHERE datname='template_postgis'"
psql -d template_postgis -f $POSTGIS_SQL_PATH/postgis.sql
psql -d template_postgis -f $POSTGIS_SQL_PATH/spatial_ref_sys.sql
psql -d template_postgis -f $POSTGIS_SQL_PATH/legacy.sql
psql -d template_postgis -c "GRANT ALL ON geometry_columns TO PUBLIC;"
psql -d template_postgis -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"
```

## Install Redis ##

Components of CartoDB, like Windshaft, depend on [Redis](http://redis.io).

To install Redis 2.2+, You can [download it here](http://redis.io/download)
or you can use `brew install redis`.


## Install Python dependencies ##

To install the Python modules that CartoDB depends on, you can use
`easy_install`:

```bash
$ easy_install pip
$ pip install -r python_requirements.txt
```

If this fails, try doing `export ARCHFLAGS='-arch i386 -arch x86_64'` 
beforehand.


## Install Varnish

[Varnish](https://www.varnish-cache.org) is a web application
accelerator. Components like Windshaft use it to speed up serving tiles
via the Maps API. 

```bash
$ pip install -e
$ git+https://github.com/RealGeeks/python-varnish.git@0971d6024fbb2614350853a5e0f8736ba3fb1f0d#egg=python-varnish
```

## Install Mapnik ##

Mapnik is an API for creating beautiful maps. CartoDB uses Mapnik 2.0
for creating and styling map tiles.

To install it using OS X, here is a nice [Homebrew
recipe](http://trac.mapnik.org/wiki/MacInstallation/Homebrew).

To install it using ubuntu, you can check the [mapnik website](http://mapnik.org/download/)

## Install CartoDB SQL API ##

The CartoDB SQL API component powers the SQL queries over HTTP. To install it:

```bash
$ git clone git@github.com:Vizzuality/CartoDB-SQL-API.git
$ cd CartoDB-SQL-API
$ npm install
```

To run CartoDB SQL API in development mode, simply type:

```bash
$ node app.js development
```

## Install Windshaft-cartodb ##

The [Windshaft-cartodb](https://github.com/Vizzuality/Windshaft-cartodb)
component powers the CartoDB Maps API. To install it:

```bash
$ git clone git@github.com:Vizzuality/Windshaft-cartodb.git
$ cd Windshaft-cartodb
$ npm install
```
To run Windshaft-cartodb in development mode, simply type:

```bash
$ node app.js development
```

## Install local instance of cold beer ##

Congratulations!
Everything you need should now be installed.
Celebrate by drinking a cold beer before continuing. :)

![](http://thesocietypages.org/socimages/files/2010/08/pabst-blue-ribbon.jpg)

# Running CartoDB #

Time to run your development version of CartoDB.

```bash
# [mysubdomain] = replace with the subdomain/username of your choice
#                 (in cartodb, username == subdomain)

# Enter the `cartodb` directory.
cd cartodb

# Create a new gemset
rvm use 1.9.2@cartodb --create

# Install local dependencies
bundle install --binstubs

# Configure the application constants
mv config/app_config.yml.sample config/app_config.yml
nano config/app_config.yml

# Configure your postgis database connection details
mv config/database.yml.sample config/database.yml
nano config/database.yml

# Add entries to /etc/hosts needed in development
echo "127.0.0.1 admin.localhost.lan" | sudo tee -a /etc/hosts
echo "127.0.0.1 admin.testhost.lan" | sudo tee -a /etc/hosts
echo "127.0.0.1 [mysubdomain].localhost.lan" | sudo tee -a /etc/hosts

# Create a development user
#
# The script will ask you for passwords and email
#
# Read the script for more informations about how to perform
# individual steps of user creation and settings management
#
sh script/create_dev_user [mysubdomain]
```

Finally, start the CartoDB development server on port 3000:

```bash
$ rails server -p 3000
```

You should now be able to access
**`http://[mysubdomain].localhost.lan:3000`**
in your browser and login with the password specified above.

# Handy tasks #

For a full list of CartoDB utility tests:

```
bundle exec rake -T
```


# Using foreman #

You can also use foreman to run the full stack (cartodb server, sql api, tiler, redis and resque), using a single command:

```
bundle exec foreman start -p $PORT
```

where $PORT is the port you want to attach the rails server to.


# Note on tiling, SQL API and Redis #

Please ensure CartoDB-SQL-API, Windshaft-cartodb, and Redis are all
running for full experience.

Manual configuration is needed for the
`public/javascripts/environments/development.js` file which configures
Windshaft-cartodb tile server URLs.


### Contributors ###

  - Fernando Blat (@ferblape)
  - Javier Álvarez Medina (@xavijam)
  - Simon Tokumine (@tokumine)
  - Alvaro Bautista (@batu)
  - Fernando Espinosa (@ferdev)
  - Sergio Alvarez Leiva (@saleiva)
  - Javier de la Torre (@jatorre)
  - Andrew W Hill (@andrewxhill)
  - Javier Santana (@javisantana)
  - Javier Arce (@javierarce)
  - Aaron Steele (@eightysteele)
  - Luis Bosque (@luisico)
  - Sandro Santilli (@strk)
  - Xabel Álvarez (@johnhackworth)
