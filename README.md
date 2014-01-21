# What is CartoDB? #

[![Build Status](http://travis-ci.org/CartoDB/cartodb.png)]
(http://travis-ci.org/CartoDB/cartodb)

CartoDB is an open source tool that allows for the storage and
visualization of geospatial data on the web.

It was built to make it easier for people to tell their stories by
providing them with flexible and intuitive ways to create maps and design
geospatial applications. CartoDB can be installed on your own server
and we also offer a hosted service at [cartodb.com](http://cartodb.com).

If you would like to see some live demos, check out our
[videos](http://www.vimeo.com/channels/cartodb) on Vimeo.
We hope you like it!

<img src="http://cartodb.s3.amazonaws.com/github/map.png" width="900px"/>


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
Maps](http://cartodb.com/maps) gallery for interactive examples
and code.

<img src="http://cartodb.s3.amazonaws.com/github/mapWizard.png" width="900px"/>
<img src="http://cartodb.s3.amazonaws.com/github/tableSQL.png" width="900px"/>

# What are the components of CartoDB? #

  - A User Interface for uploading, creating, editing, visualizing,
    and exporting geospatial data.
  - A geospatial database built on PostgreSQL and PostGIS 2.0
  - An SQL API for running SQL queries over HTTP with results formatted
    using GeoJSON and KML
  - A Map tiler that supports SQL and tile styling using CartoCSS
  - Authentication using OAuth if required

# What does CartoDB depend on? #

  - Ubuntu 10.04
  - Postgres 9.1.x
  - Redis 2.2+
  - Ruby 1.9.2
  - NodeJS 0.8.x
  - CartoDB-SQL-API
  - GEOS 3.3.4
  - GDAL 1.10.x (Starting with CartoDB 2.2.0)
  - PostGIS 2.0.x
  - Mapnik 2.1.1
  - Windshaft-cartodb
  - Varnish 2.1+ (WARNING: must be < 3.0!)
  - ImageMagick 6.6.9+ (for the testsuite)

# How do I install CartoDB? #

This is README is intended for Ubuntu 10.04. This doesn't mean that it can't 
be installed in other Linux versions or OSX systems, but that it's guaranteed 
to work only in Ubuntu 10.04.
If anyone wants to share with us the installation process for any other system 
we will be more than happy to point it from this README.
That said, there are also many successful installations on Amazon EC2, Linode,
dedicated instances and development machines running OS X and Ubuntu 10.04+.

CartoDB is under heavy development. This means that at some point this README 
can fail at some point. If you detect it, please let us know and we will fix 
it as soon as we can. Also if you feel that something is wrong or even it's 
missing we will be also happy to fix it.

For any doubt about the process you can ask in our [Google 
Group](https://groups.google.com/forum/#!forum/cartodb)

If you want to give it a try, download CartoDB by cloning this repository:

```bash
$ git clone --recursive https://github.com/CartoDB/cartodb.git
```

Or you can just [download the CartoDB zip
file](https://github.com/CartoDB/cartodb20/archive/develop.zip).

## Add CartoDB PPAs ##

Add CartoDB GIS PPA
```bash
sudo add-apt-repository ppa:cartodb/gis
```

Add CartoDB Mapnik PPA
```bash
sudo add-apt-repository ppa:cartodb/mapnik
```

Add CartoDB Node PPA
```bash
sudo add-apt-repository ppa:cartodb/nodejs
```

Add CartoDB Redis PPA
```bash
sudo add-apt-repository ppa:cartodb/redis
```

Add CartoDB PostgreSQL PPA
```bash
sudo add-apt-repository  ppa:cartodb/postgresql
```
Add CartoDB Varnish PPA
```bash
sudo add-apt-repository  ppa:cartodb/varnish
```

Resfresh repositories to use the PPAs
```bash
sudo apt-get update
```

## Some dependencies ##

unp is required for archive file upload support

```bash
sudo apt-get install unp
```

zip is required for table exports
```bash
sudo apt-get install zip
```

## Install GEOS ##
[GEOS](http://trac.osgeo.org/geos) is required for geometry function support.

```bash
sudo apt-get install libgeos-c1 libgeos-dev
```

## Install GDAL ##
[GDAL](http://www.gdal.org) is requires for raster support.

```bash
sudo apt-get install gdal-bin libgdal1-dev
```

## Install JSON-C ##
[JSON-C](http://oss.metaparadigm.com/json-c) is required for GeoJSON support.

```bash
sudo apt-get install libjson0 python-simplejson libjson0-dev
```

## Install PROJ ##
[PROJ4](http://trac.osgeo.org/proj) is required for reprojection support.

```bash
sudo apt-get install proj-bin proj-data libproj-dev
```

## Install PostgreSQL ##
[PostgreSQL](http://www.postgresql.org) is the relational database
that powers CartoDB.

```bash
sudo apt-get install postgresql-9.1 postgresql-client-9.1 postgresql-contrib-9.1 postgresql-server-dev-9.1
```

plpython is required for Python support

```bash
sudo apt-get install postgresql-plpython-9.1
```


Currently there is an error with credential-based connections for development, and all connections must be performed using method "trust" inside config file `pg_hba.conf`.

```bash
/etc/postgresql/9.1/main$ sudo vim pg_hba.conf
```

And change inside all local connections from peer/md5/... to trust.

Then restart postgres and you're done.
```bash
sudo /etc/init.d/postgresql restart
```


## Install PostGIS ##
[PostGIS](http://postgis.refractions.net) is
the geospatial extension that allows PostgreSQL to support geospatial
queries. This is the heart of CartoDB!

```bash
cd /usr/local/src
wget http://download.osgeo.org/postgis/source/postgis-2.0.2.tar.gz
tar xzf postgis-2.0.2.tar.gz
cd postgis-2.0.2
./configure --with-raster --with-topology
make
make install
```

Finally, CartoDB depends on a geospatial database template named
`template_postgis`. In the example script below (can be saved for examples as `template_postgis.sh`), make sure that the
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
psql -d template_postgis -f $POSTGIS_SQL_PATH/rtpostgis.sql
psql -d template_postgis -f $POSTGIS_SQL_PATH/topology.sql
psql -d template_postgis -c "GRANT ALL ON geometry_columns TO PUBLIC;"
psql -d template_postgis -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"
```

Before executing the script, change to the postgres user:
```bash
sudo su - postgres
./template_postgis.sh
```

## Install Ruby ##
We implemented CartoDB in the [Ruby](http://ruby-lang.org) programming language,
so you'll need to install Ruby 1.9.2. You can use rvm:

```bash
\curl -L https://get.rvm.io | bash
source /etc/profile.d/rvm.sh
rvm install 1.9.2
```

## Install Node.js ##
The tiler API and the SQL API are both [Node.js](http://nodejs.org) apps.

```bash
sudo apt-get install nodejs npm
```

We currently run our node apps against version 0.8.x. You can install NVM 
to handle multiple versions in the same system:

```bash
curl https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Then you can install and use any version, for example:
```bash
nvm install v0.8.9
nvm use 0.8.9
```


## Install Redis ##
Components of CartoDB, like Windshaft or the SQL API depend on [Redis](http://redis.io).

```bash
sudo apt-get install redis-server
```

## Install Python dependencies ##
This needs to be done from the cartodb20 local copy.
To install the Python modules that CartoDB depends on, you can use
`easy_install`.

You need to have some dependencies installed before using pip:
```bash
sudo apt-get install python2.7-dev
sudo apt-get install build-essential
```

```bash
easy_install pip
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install --no-use-wheel -r python_requirements.txt
```

## Install Varnish
[Varnish](https://www.varnish-cache.org) is a web application
accelerator. Components like Windshaft use it to speed up serving tiles
via the Maps API.

```bash
sudo apt-get install varnish
```

## Install Mapnik ##
[Mapnik](http://mapnik.org) is an API for creating beautiful maps.
CartoDB uses Mapnik for creating and styling map tiles. 

```bash
sudo apt-get install libmapnik-dev python-mapnik mapnik-utils
```

## Install CartoDB SQL API ##
The [CartoDB SQL API](https://github.com/CartoDB/CartoDB-SQL-API) 
component powers the SQL queries over HTTP. To install it:

```bash
git clone git://github.com/CartoDB/CartoDB-SQL-API.git
cd CartoDB-SQL-API
git checkout master
npm install
```

To run CartoDB SQL API in development mode, simply type:

```bash
node app.js development
```

## Install Windshaft-cartodb ##
The [Windshaft-cartodb](https://github.com/CartoDB/Windshaft-cartodb)
component powers the CartoDB Maps API. To install it:

```bash
git clone git://github.com/CartoDB/Windshaft-cartodb.git
cd Windshaft-cartodb
git checkout master
npm install
```
To run Windshaft-cartodb in development mode, simply type:

```bash
node app.js development
```

## Install ImageMagick ##

```bash
sudo apt-get install imagemagick
```

## Install local instance of cold beer ##

Congratulations!
Everything you need should now be installed.
Celebrate by drinking a cold beer before continuing. :)

![](http://thesocietypages.org/socimages/files/2010/08/pabst-blue-ribbon.jpg)

# Running CartoDB #

Time to run your development version of CartoDB. Let's suppose that
we are going to create a development env and that our user/subdomain
is going to be 'development'

```bash
export SUBDOMAIN=development

# Enter the `cartodb` directory.
cd cartodb20

# Start redis, if you haven't done so yet
# Redis must be running when starting either the
# node apps or rails or running the ``create_dev_user script``
# NOTE: the default server port is 6379, and the default
#       configuration expects redis to be listening there
redis-server

# If you are using rvm, create a new gemset
rvm use 1.9.2@cartodb --create && bundle install

# If it's a system wide installation
sudo bundle install

# Configure the application constants
mv config/app_config.yml.sample config/app_config.yml
vim config/app_config.yml

# Configure your postgres database connection details
mv config/database.yml.sample config/database.yml
vim config/database.yml

# Add entries to /etc/hosts needed in development
echo "127.0.0.1 ${SUBDOMAIN}.localhost.lan" | sudo tee -a /etc/hosts

# Create a development user
#
# The script will ask you for passwords and email
#
# Read the script for more informations about how to perform
# individual steps of user creation and settings management
#
sh script/create_dev_user ${SUBDOMAIN}
```

Start the resque daemon (needed for import jobs):

```bash
$ bundle exec script/resque
```

Finally, start the CartoDB development server on port 3000:

```bash
$ bundle exec rails s -p 3000
```

You should now be able to access
**`http://<mysubdomain>.localhost.lan:3000`**
in your browser and login with the password specified above.

# How do I upgrade CartoDB? #

See UPGRADE file for instructions about upgrading CartoDB.

For upgrade of Windshaft-CartoDB and CartoDB-SQL-API see the relative
documentation.

# Handy tasks #

For a full list of CartoDB utility tasks:

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


### Testing ###

See TESTING

### Contributors ###

  - Fernando Blat (@ferblape)
  - Javier Álvarez Medina (@xavijam)
  - Simon Tokumine (@tokumine)
  - Alvaro Bautista (@batu)
  - Fernando Espinosa (@ferdev)
  - Sergio Alvarez Leiva (@saleiva)
  - Javier de la Torre (@jatorre)
  - Andrew W Hill (@andrewxhill)
  - Javi Santana (@javisantana)
  - Javier Arce (@javierarce)
  - Aaron Steele (@eightysteele)
  - Luis Bosque (@luisico)
  - Sandro Santilli (@strk)
  - David Arango (@demimismo)
  - Xabel Álvarez (@johnhackworth)
  - Lorenzo Planas (@lorenzoplanas)
  - Alejandro Martínez (@iamzenitram)
  - Carlos Matallín (@matallo)
  - Rafa Casado (@rafacas)
  - Diego Muñoz (@kartones)
