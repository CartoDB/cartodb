
Installation
============

.. warning::
  CartoDB is guaranteed to run without any issue in Ubuntu 12.04 x64. This documentation describes de process to install CartoDB in this specific OS version.

  However this doesn't mean that it won't work with other Operating Systems or other Ubuntu. There are also many successful installations on Amazon EC2, Linode, dedicated instances and development machines running OS X and Ubuntu 12.04+.

System requirements
-------------------
Besides the OS version mentioned in the introduction, there are some systems requirements needed before starting with the installation of the stack. Also this process assumes that you have enough permissions in the system to run successfully most part of the commands of this doc.

System locales
~~~~~~~~~~~~~~

Installations assume you use UTF8. You can set the locale by doing this:

.. highlight:: bash

::

  sudo locale-gen en_US.UTF-8
  sudo update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

Build essentials
~~~~~~~~~~~~~~~~

Althoug we try to maintain packaged versions of almost every part of the stack, there are some parts like gems or npm packages that need some development tools in the system in order to compile. You can install all the needed build tools by doing this:

.. highlight:: bash

::
 
  sudo apt-get install autoconf binutils-doc bison build-essential flex

GIT
~~~

You will need git commands in order to handle some repositories and install some dependencies:

.. highlight:: bash

::

  sudo apt-get install git

APT tools
~~~~~~~~~
In order to easily install some packages repositories sources is suggested to install this tool:

.. highlight:: bash

::

  sudo apt-get install python-software-properties


PostgreSQL
----------

* Add PPA repository

.. highlight:: bash

::

  sudo add-apt-repository ppa:cartodb/postgresql-9.3


* Install client packages

.. highlight:: bash

::

  sudo apt-get install libpq5 \
                       libpq-dev \
                       postgresql-client-9.3 \
                       postgresql-client-common

* Install server packages

.. highlight:: bash

::

  sudo apt-get install postgresql-9.3 \ 
                       postgresql-contrib-9.3 \
                       postgresql-server-dev-9.3 \
                       postgresql-plpython-9.3

  
* Install schema triggers. This is a extension of packaged by cartodb needed for other postgresql extensions

.. highlight:: bash

::

  sudo add-apt-repository ppa:cartodb/pg-schema-trigger
  sudo apt-get install postgresql-9.3-pg-schema-triggers


PostgreSQL access authorization is managed through pg_hba.conf configuration file. Here it's defined how the users created in postgresql cluster can access the server. This involves several aspects like type of authentication (md5, no password, etc..) or source IP of the connection. In order to simplify the process of the installation we are going to allow connections with postgres user from localhost without authentication. Of course this can be configured in a different way at any moment but changes here should imply changes in database access configuration of CartoDB apps. 

This is the pg_hba.conf with the no password access from localhost:

.. highlight:: bash

::
  
  local   all             all                                     trust
  host    all             all             127.0.0.1/32            trust

* Create some users in PostgreSQL. These users are used by some CartoDB apps internally

.. highlight:: bash

::

  sudo createuser publicuser --no-createrole --no-createdb --no-superuser -U postgres
  sudo createuser tileuser --no-createrole --no-createdb --no-superuser -U postgres

GIS dependencies
----------------

* Add GIS PPA

.. highlight:: bash

::

  sudo add-apt-repository ppa:cartodb/gis

* Install Proj
    
.. highlight:: bash

::

  sudo apt-get install proj proj-bin proj-data libproj-dev

* Install JSON

.. highlight:: bash

::

  sudo apt-get install libjson0 libjson0-dev python-simplejson

* Install GEOS

.. highlight:: bash

::

  sudo apt-get install libgeos-c1 libgeos-dev

* Install GDAL

.. highlight:: bash

::
    
  sudo apt-get install gdal-bin libgdal1-dev


PostGIS
-------

* Install PostGIS

.. highlight:: bash

::
    
  sudo apt-get install libxml2-dev
  sudo apt-get install liblwgeom-2.1.8 postgis postgresql-9.3-postgis-2.1 postgresql-9.3-postgis-2.1-scripts

* Initialize template postgis database. We create a template database in postgresql that will contain the postgis extension. This way, every time CartoDB creates a new user database it just clones this template database

.. highlight:: bash

::
    
  sudo createdb -T template0 -O postgres -U postgres -E UTF8 template_postgis
  sudo createlang plpgsql -U postgres -d template_postgis
  psql -U postgres template_postgis -c 'CREATE EXTENSION postgis;CREATE EXTENSION postgis_topology;'
  sudo ldconfig

Redis
-----

* Add redis PPA

.. highlight:: bash

::
 
  sudo add-apt-repository ppa:cartodb/redis

* Install redis

.. highlight:: bash

::
 
  sudo apt-get install redis-server

.. warning::

  By default redis server is configured to not have any type of disk persistence. If stopped or restarted everything stored in redis will be lost. In CartoDB redis is not just a simple cache storage. It stores information that need to be persisted.

  Make sure to have proper values of *save*, *appendonly* and *appendfsync* config attributes. For more information check `http://redis.io/topics/persistence`

NodeJS
------

NodeJS is required by different parts of the stack. The more significant are the Maps and SQL APIs. It's also used to install and execute some dependencies of the editor.

* Add the PPA

.. highlight:: bash

::
 
  sudo add-apt-repository ppa:cartodb/nodejs-010

* Install NodeJS

.. highlight:: bash

::
 
  sudo apt-get install nodejs npm

SQL API
-------




* Install NodeJS


Ruby
----

Editor
------

CartoDB PostgreSQL extension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

DB Setup
~~~~~~~~

DB migration
~~~~~~~~~~~~

Assets
~~~~~~



CartoDB is under heavy development. This means that this README can fail at some point. If see any issues, please let us know and we will fix them as soon as we can. Also if you feel that something is wrong or even missing we will be happy to fix it.

For any doubt about the process you can ask in our [Google 
Group](https://groups.google.com/forum/#!forum/cartodb).



system configuration
--------------------


system dependencies
-------------------

These are the third party modules we use:

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

In order to install it using apt-get you need to install cartodb [PPA](https://help.ubuntu.com/community/PPA)s

.. highlight:: bash

::

    sudo apt-get update
    sudo apt-get install python-software-properties
    sudo add-apt-repository ppa:cartodb/base
    sudo add-apt-repository ppa:cartodb/gis
    sudo add-apt-repository ppa:cartodb/mapnik
    sudo add-apt-repository ppa:cartodb/nodejs
    sudo add-apt-repository ppa:cartodb/redis
    sudo add-apt-repository ppa:cartodb/postgresql-9.3
    sudo add-apt-repository ppa:cartodb/nodejs-010
    sudo apt-get update
    sudo apt-get install build-essential checkinstall
    sudo apt-get install unp
    sudo apt-get install zip
    sudo apt-get install libgeos-c1 libgeos-dev
    sudo apt-get install gdal-bin libgdal1-dev
    sudo apt-get install libjson0 python-simplejson libjson0-dev
    sudo apt-get install proj-bin proj-data libproj-dev
    sudo apt-get install postgresql-9.3 postgresql-client-9.3 postgresql-contrib-9.3 postgresql-server-dev-9.3
    sudo apt-get install postgresql-plpython-9.3
    sudo apt-get install redis-server
    sudo apt-get install python2.7-dev
    sudo apt-get install build-essential
    sudo apt-get install python-setuptools
    sudo apt-get install libmapnik-dev python-mapnik mapnik-utils
    sudo apt-get install nodejs
    sudo apt-get install imagemagick


After install everything postgres need to be configured since there is an error with credential-based connections for development, and all connections must be performed using method "trust" inside config file `pg_hba.conf`.

.. highlight:: bash

::

    cd /etc/postgresql/9.3/main
    sudo vim pg_hba.conf

And change inside all local connections from ``peer/md5/...`` to ``trust``.

Then restart postgres and you're done.

.. highlight:: bash

::

    sudo /etc/init.d/postgresql restart

Install PostGIS
---------------
[PostGIS](http://postgis.net) is
the geospatial extension that allows PostgreSQL to support geospatial
queries. This is the heart of CartoDB!

.. highlight:: bash

::

    cd /usr/local/src
    sudo wget http://download.osgeo.org/postgis/source/postgis-2.1.7.tar.gz
    sudo tar -xvzf postgis-2.1.7.tar.gz
    cd postgis-2.1.7
    sudo ./configure --with-raster --with-topology
    sudo make
    sudo make install

Finally, CartoDB depends on a geospatial database template named
`template_postgis`. 

.. highlight:: bash

::

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

Install Python dependencies 
---------------------------

This needs to be done from the cartodb local copy.
To install the Python modules that CartoDB depends on.

.. highlight:: bash

::

    easy_install pip
    export CPLUS_INCLUDE_PATH=/usr/include/gdal
    export C_INCLUDE_PATH=/usr/include/gdal
    pip install --no-use-wheel -r python_requirements.txt
    exit

If the previous step fails, try this alternative:

.. highlight:: bash

::

    export CPLUS_INCLUDE_PATH=/usr/include/gdal
    export C_INCLUDE_PATH=/usr/include/gdal
    sudo pip install --no-install GDAL
    cd /tmp/pip_build_root/GDAL
    sudo python setup.py build_ext --include-dirs=/usr/include/gdal
    sudo pip install --no-download GDAL


Install Ruby 
-------------

We implemented CartoDB in the [Ruby](http://ruby-lang.org) programming language, you'll need to install Ruby **1.9.3**. You can use rbenv or a system install, up to you.

For rbenv the official guide on https://github.com/sstephenson/rbenv#installation

For bundler simply run:

.. highlight:: bash

::

    gem install bundler


cartodb-postgresql 
------------------

This is the postgres extension needed to run cartodb

.. highlight:: bash

::

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

.. warning::
    if test_ddl_triggers fails it's likely due to an incomplete installation of schema_triggers.
    You need to add schema_triggers.so to the shared_preload_libraries setting in postgresql.conf :

    ::

        $ sudo vim /etc/postgresql/9.3/main/postgresql.conf
         shared_preload_libraries = 'schema_triggers.so'
        $ sudo service postgresql restart # restart postgres

After this change the 2nd installcheck of cartodb-postresql should be OK.

Check https://github.com/cartodb/cartodb-postgresql/ for further reference





Install CartoDB SQL API 
-----------------------
The [CartoDB SQL API](https://github.com/CartoDB/CartoDB-SQL-API) 
component powers the SQL queries over HTTP. To install it:

.. highlight:: bash

::

    git clone git://github.com/CartoDB/CartoDB-SQL-API.git
    cd CartoDB-SQL-API
    git checkout master
    npm install
    cp config/environments/development.js.example config/environments/development.js

To run CartoDB SQL API in development mode, simply type:

```bash
node app.js development
```

Install Windshaft-cartodb 
-------------------------


The [Windshaft-cartodb](https://github.com/CartoDB/Windshaft-cartodb)
component powers the CartoDB Maps API. To install it:

.. highlight:: bash

::
    git clone git://github.com/CartoDB/Windshaft-cartodb.git
    cd Windshaft-cartodb
    git checkout master
    npm install
    cp config/environments/development.js.example config/environments/development.js

To run Windshaft-cartodb in development mode, simply type:

```bash
node app.js development
```

CartoDB
-------

This is the main cartodb repository

.. highlight:: bash

::

    git clone --recursive https://github.com/CartoDB/cartodb.git
    cd cartodb
    bundle install
    cp config/app_config.yml.sample config/app_config.yml

Install problems and common solutions 
-------------------------------------

Installing the full stack might not always be smooth due to other component updates, so if you run into problems installing CartoDB, please check [this list of problems and solutions](https://github.com/CartoDB/cartodb/wiki/Problems-faced-during-CartoDB-install-&-solutions-if-known) first to see if your problem already happened in the past and somebody else found a workaround, solution or fix to it.
