
Installation
============

.. warning::
  CARTO works with Ubuntu 16.04 x64. This documentation describes the process to install CartoDB in this specific OS version.

  However this doesn't mean that it won't work with other Operating Systems or other Ubuntu. There are also many successful installations on Amazon EC2, Linode, dedicated instances and development machines running OS X and Ubuntu 12.04+.

  You will find notes along this guide explaining some of the Ubuntu 16.04 specifics, and pointing to alternative solutions for other environments.

System requirements
-------------------
Besides the OS version mentioned in the introduction, there are some system requirements needed before starting with the installation of the stack. Also this process assumes that you have enough permissions in the system to run successfully most part of the commands of this doc.

System locales
~~~~~~~~~~~~~~

Installations assume you use UTF8. You can set the locale by doing this:

.. code-block:: bash

  sudo locale-gen en_US.UTF-8
  sudo update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8


Build essentials
~~~~~~~~~~~~~~~~

Although we try to maintain packaged versions of almost every part of the stack, there are some parts like gems or npm packages that need some development tools in the system in order to compile. You can install all the needed build tools by doing this:

.. code-block:: bash

  sudo apt-get install make pkg-config


GIT
~~~

You will need git commands in order to handle some repositories and install some dependencies:

.. code-block:: bash

  sudo apt-get install git

PostgreSQL
----------

.. note::
  CARTO requires PostgreSQL 10+. The PPA packages also provide some additional patches, which are not needed but help improve the experience in production environments.

* Add PPA repository

  .. code-block:: bash

    sudo add-apt-repository ppa:cartodb/postgresql-10 && sudo apt-get update

* Install packages

  .. code-block:: bash

    sudo apt-get install postgresql-10 \
                         postgresql-plpython-10 \
                         postgresql-server-dev-10


PostgreSQL access authorization is managed through pg_hba.conf configuration file, which is normally in ``/etc/postgresql/10/main/pg_hba.conf``. Here it's defined how the users created in postgresql cluster can access the server. This involves several aspects like type of authentication (md5, no password, etc..) or source IP of the connection. In order to simplify the process of the installation we are going to allow connections with postgres user from localhost without authentication. Of course this can be configured in a different way at any moment but changes here should imply changes in database access configuration of CARTO apps.

Edit ``/etc/postgresql/10/main/pg_hba.conf``, modifying the existing lines to use ``trust`` authentication (no password access from localhost):

  .. code-block:: bash

    local   all             postgres                                trust
    local   all             all                                     trust
    host    all             all             127.0.0.1/32            trust

For these changes to take effect, you'll need to restart postgres:

  .. code-block:: bash

    sudo systemctl restart postgresql


* Create some users in PostgreSQL. These users are used by some CARTO apps internally

  .. code-block:: bash

    sudo createuser publicuser --no-createrole --no-createdb --no-superuser -U postgres
    sudo createuser tileuser --no-createrole --no-createdb --no-superuser -U postgres

* Install CartoDB postgresql extension. This extension contains functions that are used by different parts of the CartoDB platform, included Builder and the SQL and Maps API.

  .. code-block:: bash

    git clone https://github.com/CartoDB/cartodb-postgresql.git
    cd cartodb-postgresql
    git checkout <LATEST cartodb-postgresql tag>
    sudo make all install

GIS dependencies
----------------

* Add GIS PPA

  .. code-block:: bash

    sudo add-apt-repository ppa:cartodb/gis && sudo apt-get update


* Install GDAL

  .. code-block:: bash

    sudo apt-get install gdal-bin libgdal-dev

PostGIS
-------

.. note::
  CARTO requires PostGIS 2.4. The PPA just packages this version for Ubuntu 16.04.

* Install PostGIS

  .. code-block:: bash

    sudo apt-get install postgis

* Initialize template postgis database. We create a template database in postgresql that will contain the postgis extension. This way, every time CartoDB creates a new user database it just clones this template database

  .. code-block:: bash

    sudo createdb -T template0 -O postgres -U postgres -E UTF8 template_postgis
    psql -U postgres template_postgis -c 'CREATE EXTENSION postgis;CREATE EXTENSION postgis_topology;'
    sudo ldconfig

* (Optional) Run an installcheck to verify the database has been installed properly

  .. code-block:: bash

   sudo PGUSER=postgres make installcheck # to run tests

  Check https://github.com/cartodb/cartodb-postgresql for further reference


Redis
-----

.. note::
    CARTO requires Redis 4+. You can also optionally install redis-cell for rate limiting, which is not described by this guide.

* Add redis PPA

  .. code-block:: bash

    sudo add-apt-repository ppa:cartodb/redis-next && sudo apt-get update

* Install redis

  .. code-block:: bash

    sudo apt-get install redis

.. warning::

  By default redis server is configured to only have periodic snapshotting to disk. If stopped or restarted some data stored in redis since the last snahpshot can be lost. In CARTO redis is not just a simple cache storage. It stores information that need to be persisted.

  For data safety, make sure to have proper values of *save*, *appendonly* and *appendfsync* config attributes. For more information check `http://redis.io/topics/persistence`

Node.js
-------

.. note::
    CARTO requires Node.js 10+ and npm 6+.

Node.js is required by different parts of the stack. The more significant are the Maps and SQL APIs. It's also used to install and execute some dependencies of Builder.

* Install Node.js

  .. code-block:: bash

    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs

  Note this should install both Node.js 10.x and npm 6.x. You can verify the installation went as expected with:

  .. code-block:: bash

    node -v
    npm -v

We will also install some development libraries that will be necessary to build some Node.js modules:

  .. code-block:: bash

    sudo apt-get install libpixman-1-0 libpixman-1-dev
    sudo apt-get install libcairo2-dev libjpeg-dev libgif-dev libpango1.0-dev

SQL API
-------

* Download API

  .. code-block:: bash

    git clone git@github.com:CartoDB/CartoDB-SQL-API.git
    cd CartoDB-SQL-API

* Install npm dependencies

  .. code-block:: bash

    npm install

* Create configuration. The name of the filename of the configuration must be the same than the environment you are going to use to start the service. Let's assume it's development.

  .. code-block:: bash

    cp config/environments/development.js.example config/environments/development.js


* Start the service. The second parameter is always the environment if the service. Remember to use the same you used in the configuration.

  .. code-block:: bash

    node app.js development


MAPS API
--------

* Download API

  .. code-block:: bash

    git clone git@github.com:CartoDB/Windshaft-cartodb.git
    cd Windshaft-cartodb

* Install yarn dependencies

  .. code-block:: bash

    npm install

* Create configuration. The name of the filename of the configuration must be the same than the environment you are going to use to start the service. Let's assume it's development.

  .. code-block:: bash

    cp config/environments/development.js.example config/environments/development.js
    mkdir logs


* Start the service. The second parameter is always the environment of the service. Remember to use the same you used in the configuration.

  .. code-block:: bash

    node app.js development


Ruby
----

.. note::
  CARTO requires exactly Ruby 2.4.x. Older or newer versions won't work.

* Add brightbox ruby repositories

  .. code-block:: bash

    sudo apt-add-repository ppa:brightbox/ruby-ng && sudo apt-get update

* Install ruby 2.4

  .. code-block:: bash

    sudo apt-get install ruby2.4 ruby2.4-dev

* Install bundler. Bundler is an app used to manage ruby dependencies. It is needed by CARTO Builder

  .. code-block:: bash

    sudo apt-get install ruby-bundler


* Install compass. It will be needed later on by CARTO's Builder

  .. code-block:: bash

    sudo gem install compass


Builder
-------

.. note::
  CARTO users Python 2.7+. Python 3 will not work correctly.

* Download Builder's code

  .. code-block:: bash

    git clone --recursive https://github.com/CartoDB/cartodb.git
    cd cartodb

* Install pip

  .. code-block:: bash

   sudo apt-get install python-pip


* Install ruby dependencies

  .. code-block:: bash

    sudo apt-get install imagemagick unp zip libicu-dev
    RAILS_ENV=development bundle install


* Install python dependencies

  .. code-block:: bash

    sudo pip install --no-use-wheel -r python_requirements.txt

.. warning::
    If this fails due to the installation of the gdal package not finding Python.h or any other header file, you'll need to do this:

    ::

        export CPLUS_INCLUDE_PATH=/usr/include/gdal
        export C_INCLUDE_PATH=/usr/include/gdal
        export PATH=$PATH:/usr/include/gdal

    After this, re-run the pip install command. Variables can be passed to sudo if exporting them and re-running ``pip install`` doesn't work:

    .. code-block:: bash

       sudo CPLUS_INCLUDE_PATH=/usr/include/gdal C_INCLUDE_PATH=/usr/include/gdal PATH=$PATH:/usr/include/gdal pip install --no-use-wheel -r python_requirements.txt

    If gdal keeps failing, see more information here: http://gis.stackexchange.com/questions/28966/python-gdal-package-missing-header-file-when-installing-via-pip

* Install Node.js dependencies

  .. code-block:: bash

    npm install


* Compile static assets

  .. code-block:: bash

    npm run carto-node && npm run build:static

* (Optional) Precompile assets. Needed if you don't want to use CARTO's CDN for assets.

  .. code-block:: bash

    export PATH=$PATH:$PWD/node_modules/grunt-cli/bin
    bundle exec grunt --environment=development


* Create configuration files

  .. code-block:: bash

    cp config/app_config.yml.sample config/app_config.yml
    cp config/database.yml.sample config/database.yml

* Start the redis-server that allows access to the SQL and Maps APIs:

  .. code-block:: bash

    sudo systemctl start redis-server

* Initialize the metadata database

  .. code-block:: bash

    RAILS_ENV=development bundle exec rake db:create
    RAILS_ENV=development bundle exec rake db:migrate

* Start Builder's HTTP server

  .. code-block:: bash

    RAILS_ENV=development bundle exec rails server

* In a different process/console start the resque process

  .. code-block:: bash

    RAILS_ENV=development bundle exec ./script/resque
