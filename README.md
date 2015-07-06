# What is CartoDB? #

[![Build Status](http://clinker.cartodb.net/desktop/plugin/public/status/CartoDB-master-testing)]
(http://clinker.cartodb.net/jenkins/job/CartoDB-master-testing)
[![Code Climate](https://codeclimate.com/github/CartoDB/cartodb20.png)](https://codeclimate.com/github/CartoDB/cartodb20)

CartoDB is an open source tool that allows for the storage and
visualization of geospatial data on the web.

It was built to make it easier for people to tell their stories by
providing them with flexible and intuitive ways to create maps and design
geospatial applications. CartoDB can be installed on your own server
and we also offer a hosted service at [cartodb.com](http://cartodb.com).

If you would like to see some live demos, check out our
[videos](http://www.vimeo.com/channels/cartodb) on Vimeo.
We hope you like it!

![Map View](http://cartodb.s3.amazonaws.com/github/map_view.png)

---
## Table of Contents

- [What can I do with CartoDB?](#what-can-i-do-with-cartodb)
- [What are the components of CartoDB](#what-are-the-components-of-cartodb)
- [How do I install CartoDB?](#how-do-i-install-cartodb)
  - [Dependencies](#what-does-cartodb-depend-on)
  - ...
  - [Install problems and common solutions](#install-problems-and-common-solutions)
- [Running CartoDB](#running-cartodb)
  - [Note on tiling SQL API and Redis](#note-on-tiling-sql-api-and-redis)
  - [Handy tasks](#handy-tasks)
  - [Using foreman](#using-foreman)
- [Developing & Contributing to CartoDB](#developing--contributing-to-cartodb)
- [How do I Upgrade CartodB?](#how-do-i-upgrade-cartodb)
- [Testing](#testing)
- [Contributors](#contributors)

---

# What can I do with CartoDB? #

With CartoDB, you can upload your geospatial data (Shapefiles, GeoJSON,
etc) using a web form and then make it public or private.

After it is uploaded, you can visualize it in a table or on a map, search
it using SQL, and apply map styles using CartoCSS. You can even access it
using the CartoDB [API OVERVIEW](http://developers.cartodb.com/documentation/apis-overview.html)
and [SQL API](http://developers.cartodb.com/documentation/sql-api.html), or export it
to a file.

In other words, with CartoDB you can make awesome maps and build
powerful geospatial applications! Definitely check out the [CartoDB
Develop](http://cartodb.com/develop) for interactive examples
and code.

![Map View Wizard](http://cartodb.s3.amazonaws.com/github/map_view_wizard.png)
![Data View](http://cartodb.s3.amazonaws.com/github/data_view.png)

# What are the components of CartoDB? #

  - A User Interface for uploading, creating, editing, visualizing,
    and exporting geospatial data.
  - A geospatial database built on PostgreSQL and PostGIS 2.1
  - An SQL API for running SQL queries over HTTP with results formatted
    using GeoJSON and KML
  - A Map tiler that supports SQL and tile styling using CartoCSS
  - Authentication using OAuth if required


# How do I install CartoDB? #

This README is intended for Ubuntu 12.04. This doesn't mean that it can't 
be installed on other Linux versions or OSX systems, but that it's guaranteed 
to work only in Ubuntu 12.04.
If anyone wants to share with us the installation process for any other system 
we will be more than happy to point it from this README.
That said, there are also many successful installations on Amazon EC2, Linode,
dedicated instances and development machines running OS X and Ubuntu 12.04+.

CartoDB is under heavy development. This means that this README 
can fail at some point. If see any issues, please let us know and we will fix 
them as soon as we can. Also if you feel that something is wrong or even
missing we will be happy to fix it.

For any doubt about the process you can ask in our [Google 
Group](https://groups.google.com/forum/#!forum/cartodb).

If you want to give it a try, download CartoDB by cloning this repository:

```bash
$ git clone --recursive https://github.com/CartoDB/cartodb.git
```

Or you can just [download the CartoDB zip
file](https://github.com/CartoDB/cartodb/archive/master.zip).


## What does CartoDB depend on? #

  - Ubuntu 12.04
  - Postgres 9.3.x (with plpythonu extension)
  - [cartodb-postgresql](https://github.com/CartoDB/cartodb-postgresql) extension
  - Redis 2.8+
  - Ruby 1.9.3
  - Node.js 0.10.x
  - CartoDB-SQL-API
  - GEOS 3.3.4
  - GDAL 1.10.x (Starting with CartoDB 2.2.0)
  - PostGIS 2.1.x
  - Mapnik 2.1.1
  - Windshaft-cartodb
  - ImageMagick 6.6.9+ (for the testsuite)


## Add CartoDB [PPA](https://help.ubuntu.com/community/PPA)s ##

First, retrieve new lists of packages:
```
sudo apt-get update
```

Install python software properties to be able to run `add-apt-repository`
```
sudo apt-get install python-software-properties
```

Add CartoDB Base PPA
```bash
sudo add-apt-repository ppa:cartodb/base
```

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
sudo add-apt-repository  ppa:cartodb/postgresql-9.3
```
Resfresh repositories to use the PPAs
```bash
sudo apt-get update
```

## Some dependencies ##

Installations assume you use UTF8, you can set it like this:
```bash
echo -e 'LANG=en_US.UTF-8\nLC_ALL=en_US.UTF-8' | sudo tee /etc/default/locale
source /etc/default/locale
```

[make](https://help.ubuntu.com/community/CompilingEasyHowTo) is required to compile sources
```bash
sudo apt-get install build-essential checkinstall
```

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
sudo apt-get install postgresql-9.3 postgresql-client-9.3 postgresql-contrib-9.3 postgresql-server-dev-9.3
```

plpython is required for Python support

```bash
sudo apt-get install postgresql-plpython-9.3
```


Currently there is an error with credential-based connections for development, and all connections must be performed using method "trust" inside config file `pg_hba.conf`.

```bash
cd /etc/postgresql/9.3/main
sudo vim pg_hba.conf
```

And change inside all local connections from peer/md5/... to trust.

Then restart postgres and you're done.
```bash
sudo /etc/init.d/postgresql restart
```


## Install PostGIS ##
[PostGIS](http://postgis.net) is
the geospatial extension that allows PostgreSQL to support geospatial
queries. This is the heart of CartoDB!

```bash
cd /usr/local/src
sudo wget http://download.osgeo.org/postgis/source/postgis-2.1.7.tar.gz
sudo tar -xvzf postgis-2.1.7.tar.gz
cd postgis-2.1.7
sudo ./configure --with-raster --with-topology
sudo make
sudo make install
```

Finally, CartoDB depends on a geospatial database template named
`template_postgis`. 

```bash
sudo su - postgres
POSTGIS_SQL_PATH=`pg_config --sharedir`/contrib/postgis-2.1
createdb -E UTF8 template_postgis
createlang -d template_postgis plpgsql
psql -d postgres -c "UPDATE pg_database SET datistemplate='true' WHERE datname='template_postgis'"
psql -d template_postgis -c "CREATE EXTENSION postgis"
psql -d template_postgis -c "CREATE EXTENSION postgis_topology"
psql -d template_postgis -c "GRANT ALL ON geometry_columns TO PUBLIC;"
psql -d template_postgis -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"
exit
```

## Install cartodb-postgresql ##

```bash
cd /tmp
git clone https://github.com/CartoDB/pg_schema_triggers.git
cd pg_schema_triggers
sudo make all install PGUSER=postgres
sudo make installcheck PGUSER=postgres # to run tests
cd ..
git clone https://github.com/CartoDB/cartodb-postgresql.git
cd cartodb-postgresql
git checkout cdb
sudo make all install
sudo PGUSER=postgres make installcheck # to run tests
```

**NOTE:** if test_ddl_triggers fails it's likely due to an incomplete installation of schema_triggers.
You need to add schema_triggers.so to the shared_preload_libraries setting in postgresql.conf :

```
$ sudo vim /etc/postgresql/9.3/main/postgresql.conf
...
shared_preload_libraries = 'schema_triggers.so'

$ sudo service postgresql restart # restart postgres
```

After this change the 2nd installcheck of cartodb-postresql should be OK.

Check https://github.com/cartodb/cartodb-postgresql/ for further reference

## Install Ruby ##

We implemented CartoDB in the [Ruby](http://ruby-lang.org) programming language, you'll need to install Ruby 1.9.3. You can use rbenv or a system install, up to you.

For rbenv:

### rbenv
Follow the official guide on https://github.com/sstephenson/rbenv#installation

For bundler simply run:

```bash
gem install bundler
```

## Install Node.js ##
The tiler API and the SQL API are both [Node.js](http://nodejs.org) apps.

```bash
sudo add-apt-repository ppa:cartodb/nodejs-010
sudo apt-get update
sudo apt-get install nodejs
```

We currently run our node apps against version 0.10. You can install [NVM](https://github.com/creationix/nvm) 
to handle multiple versions in the same system.

Then you can install and use any version, for example:
```bash
nvm install v0.10
nvm use 0.10
```


## Install Redis ##
Components of CartoDB, like Windshaft or the SQL API depend on [Redis](http://redis.io).

```bash
sudo apt-get install redis-server
```

## Install Python dependencies ##
This needs to be done from the cartodb local copy.
To install the Python modules that CartoDB depends on, you can use
`easy_install`.

You need to have some dependencies installed before using pip:
```bash
sudo apt-get install python2.7-dev
sudo apt-get install build-essential
sudo su
apt-get install python-setuptools
```

```bash
easy_install pip
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install --no-use-wheel -r python_requirements.txt
exit
```

If the previous step fails, try this alternative:
```bash
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
sudo pip install --no-install GDAL
cd /tmp/pip_build_root/GDAL
sudo python setup.py build_ext --include-dirs=/usr/include/gdal
sudo pip install --no-download GDAL
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
cp config/environments/development.js.example config/environments/development.js
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
cp config/environments/development.js.example config/environments/development.js
```
To run Windshaft-cartodb in development mode, simply type:

```bash
node app.js development
```

## Install ImageMagick ##

```bash
sudo apt-get install imagemagick
```

## Optional components
The following are not strictly required to run CartoDB:

### Varnish

[Varnish](https://www.varnish-cache.org) is a web application
accelerator. Components like Windshaft use it to speed up serving tiles
via the Maps API.

Add CartoDB Varnish PPA and install it:
```bash
sudo add-apt-repository  ppa:cartodb/varnish
sudo apt-get update
sudo apt-get install varnish=2.1.5.1-cdb1 #or any version <3.x
```

Varnish should allow telnet access in order to work with CartoDB, so you need to edit the `/etc/default/varnish` file and in the `DAEMON_OPTS` variable remove the `-S /etc/varnish/secret \` line.

### Raster import support
Raster importer needs `raster2pgsql` to be in your path. You can check whether it's available by running `which raster2pgsql`. If it's not, you should link it: `$ sudo ln -s /usr/local/src/postgis-2.1.7/raster/loader/raster2pgsql /usr/bin/`.

Access to temporary dir is also needed. Depending on your installation you might also need to run `sudo chown 501:staff /usr/local/src/postgis-2.1.7/raster/loader/.libs` (maybe replacing `501:staff` with your installation /usr/local/src/postgis-2.1.7/raster/loader/ group and owner).

## Install problems and common solutions #

Installing the full stack might not always be smooth due to other component updates, so if you run into problems installing CartoDB, please check [this list of problems and solutions](https://github.com/CartoDB/cartodb/wiki/Problems-faced-during-CartoDB-install-&-solutions-if-known) first to see if your problem already happened in the past and somebody else found a workaround, solution or fix to it.

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
cd cartodb

# Start redis, if you haven't done so yet
# Redis must be running when starting either the
# node apps or rails or running the ``create_dev_user script``
# NOTE: the default server port is 6379, and the default
#       configuration expects redis to be listening there
redis-server

# If it's a system wide installation
sudo bundle install

# If you are using rbenv simply run:
rbenv local 1.9.3-p551
bundle install

# Configure the application constants
cp config/app_config.yml.sample config/app_config.yml
vim config/app_config.yml

# Configure your postgres database connection details
cp config/database.yml.sample config/database.yml
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

## Note on tiling, SQL API and Redis

Please ensure CartoDB-SQL-API, Windshaft-cartodb, and Redis are all
running for full experience.

Manual configuration is needed for the
`public/javascripts/environments/development.js` file which configures
Windshaft-cartodb tile server URLs.

## Handy tasks

For a full list of CartoDB utility tasks:

```
bundle exec rake -T
```

## Using foreman

You can also use foreman to run the full stack (cartodb server, sql api, tiler, redis and resque), using a single command:
IMPORTANT: You need to install foreman by yourself. It's not included in the Gemfile. Run this:

```
bundle exec gem install foreman
```

```
bundle exec foreman start -p $PORT
```

where $PORT is the port you want to attach the rails server to.


# How do I upgrade CartoDB? #

See [UPGRADE](UPGRADE) for instructions about upgrading CartoDB.

For upgrade of Windshaft-CartoDB and CartoDB-SQL-API see the relative
documentation.

# Developing & Contributing to CartoDB

See [CONTRIBUTING.md](CONTRIBUTING.md) for how you can improve CartoDB. :)

# Testing

See [TESTING.md](TESTING.md)

# Contributors

  - Fernando Blat ([ferblape](https://twitter.com/ferblape))
  - Javier Álvarez Medina ([xavijam](https://twitter.com/xavijam))
  - Simon Tokumine ([tokumine](https://twitter.com/tokumine))
  - Alvaro Bautista ([batu](https://twitter.com/batu))
  - Fernando Espinosa ([ferdev](https://twitter.com/ferdev))
  - Sergio Alvarez Leiva ([saleiva](https://twitter.com/saleiva))
  - Javier de la Torre ([jatorre](https://twitter.com/jatorre))
  - Andrew W Hill ([andrewxhill](https://twitter.com/andrewxhill))
  - Javi Santana ([javisantana](https://twitter.com/javisantana))
  - Javier Arce ([javierarce](https://twitter.com/javierarce))
  - Aaron Steele ([eightysteele](https://twitter.com/eightysteele))
  - Luis Bosque ([luisico](https://twitter.com/luisico))
  - Sandro Santilli ([strk](https://twitter.com/strk))
  - David Arango ([demimismo](https://twitter.com/demimismo))
  - Xabel Álvarez ([johnhackworth](https://twitter.com/johnhackworth))
  - Lorenzo Planas ([lorenzoplanas](https://twitter.com/lorenzoplanas))
  - Alejandro Martínez ([iamzenitram](https://twitter.com/iamzenitram))
  - Carlos Matallín ([matallo](https://twitter.com/matallo))
  - Rafa Casado ([rafacas](https://twitter.com/rafacas))
  - Diego Muñoz ([kartones](https://twitter.com/kartones))
  - Raul Ochoa ([rochoa](https://twitter.com/rochoa))
  - Nicolás M. Jaremek ([NickJaremek](https://twitter.com/NickJaremek))
  - Jaime Chapinal ([Xatpy](https://twitter.com/chapi13))
  - Nicklas Gummesson ([ViddoBamBam](https://twitter.com/ViddoBamBam))
  - Dimitri Roche ([dimroc](https://github.com/dimroc))
  - Carla iriberri ([iriberri](https://github.com/iriberri))
  - Rafa de la Torre ([rafatower](https://github.com/rafatower))
  - Nacho Sánchez ([juanignaciosl](https://github.com/juanignaciosl))
  - Francisco Dans ([fdansv](https://github.com/fdansv))
  - Pablo Alonso ([alonsogarciapablo](https://github.com/alonsogarciapablo))
