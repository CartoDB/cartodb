
Installation
============

.. warning::
  CartoDB is guaranteed to run without any issue in Ubuntu 12.04 x64. This documentation describes the process to install CartoDB in this specific OS version.

  However this doesn't mean that it won't work with other Operating Systems or other Ubuntu. There are also many successful installations on Amazon EC2, Linode, dedicated instances and development machines running OS X and Ubuntu 12.04+.

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
 
  sudo apt-get install autoconf binutils-doc bison build-essential flex

GIT
~~~

You will need git commands in order to handle some repositories and install some dependencies:

.. code-block:: bash

  sudo apt-get install git

APT tools
~~~~~~~~~
In order to easily install some packages repositories sources is suggested to install this tool:

.. code-block:: bash

  sudo apt-get install python-software-properties 


PostgreSQL
----------

* Add PPA repository

  .. code-block:: bash
  
    sudo add-apt-repository ppa:cartodb/postgresql-9.3 && sudo apt-get update


* Install client packages

  .. code-block:: bash
  
    sudo apt-get install libpq5 \
                         libpq-dev \
                         postgresql-client-9.3 \
                         postgresql-client-common

* Install server packages

  .. code-block:: bash
  
    sudo apt-get install postgresql-9.3 \ 
                         postgresql-contrib-9.3 \
                         postgresql-server-dev-9.3 \
                         postgresql-plpython-9.3

  


PostgreSQL access authorization is managed through pg_hba.conf configuration file, which is normally in /etc/postgresql/9.3/main/pg_hba.conf. Here it's defined how the users created in postgresql cluster can access the server. This involves several aspects like type of authentication (md5, no password, etc..) or source IP of the connection. In order to simplify the process of the installation we are going to allow connections with postgres user from localhost without authentication. Of course this can be configured in a different way at any moment but changes here should imply changes in database access configuration of CartoDB apps. 

This is the pg_hba.conf with the no password access from localhost:

  .. code-block:: bash
  
    local   all             postgres                                trust
    local   all             all                                     trust
    host    all             all             127.0.0.1/32            trust

For these changes to take effect, you'll need to restart postgres:

  .. code-block:: bash
  
    sudo service postgresql restart

  

* Create some users in PostgreSQL. These users are used by some CartoDB apps internally

  .. code-block:: bash
  
    sudo createuser publicuser --no-createrole --no-createdb --no-superuser -U postgres
    sudo createuser tileuser --no-createrole --no-createdb --no-superuser -U postgres
    
* Install CartoDB postgresql extension. This extension contains functions that are used by different parts of the CartoDB platform, included the Editor and the SQL and Maps API.

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

* Install Proj
    
  .. code-block:: bash
  
    sudo apt-get install proj proj-bin proj-data libproj-dev 

* Install JSON

  .. code-block:: bash
  
    sudo apt-get install libjson0 libjson0-dev python-simplejson

* Install GEOS

  .. code-block:: bash
  
    sudo apt-get install libgeos-c1v5 libgeos-dev

* Install GDAL

  .. code-block:: bash
      
    sudo apt-get install gdal-bin libgdal1-dev libgdal-dev
    sudo apt-get install gdal2.1-static-bin


PostGIS
-------

* Install PostGIS

  .. code-block:: bash
      
    sudo apt-get install libxml2-dev
    sudo apt-get install liblwgeom-2.1.8 postgis postgresql-9.3-postgis-2.2 postgresql-9.3-postgis-scripts

* Initialize template postgis database. We create a template database in postgresql that will contain the postgis extension. This way, every time CartoDB creates a new user database it just clones this template database

  .. code-block:: bash
      
    sudo createdb -T template0 -O postgres -U postgres -E UTF8 template_postgis
    sudo createlang plpgsql -U postgres -d template_postgis
    psql -U postgres template_postgis -c 'CREATE EXTENSION postgis;CREATE EXTENSION postgis_topology;'
    sudo ldconfig

* Run an installcheck to verify the database has been installed properly

  .. code-block:: bash
      
   sudo PGUSER=postgres make installcheck # to run tests

  Check https://github.com/cartodb/cartodb-postgresql for further reference

* Restart PostgreSQL after all this process

  .. code-block:: bash
      
    sudo service postgresql restart
  

Redis
-----

Redis 3+ is needed.

* Add redis PPA

  .. code-block:: bash
   
    sudo add-apt-repository ppa:cartodb/redis && sudo apt-get update

* Install redis

  .. code-block:: bash
   
    sudo apt-get install redis-server

.. warning::

  By default redis server is configured to not have any type of disk persistence. If stopped or restarted everything stored in redis will be lost. In CartoDB redis is not just a simple cache storage. It stores information that need to be persisted.

  Make sure to have proper values of *save*, *appendonly* and *appendfsync* config attributes. For more information check `http://redis.io/topics/persistence`

NodeJS
------

NodeJS is required by different parts of the stack. The more significant are the Maps and SQL APIs. It's also used to install and execute some dependencies of the editor.

* Add the PPA

  .. code-block:: bash
   
    sudo add-apt-repository ppa:cartodb/nodejs-010 && sudo apt-get update

* Install NodeJS 

  .. code-block:: bash
   
    sudo apt-get install nodejs 

  Note this should install both NodeJS 0.10.26 and npm 2.14.16. You can verify the installation went as expected with:
  
  .. code-block:: bash
   
    nodejs -v
    npm -v


SQL API
-------

* Download API

  .. code-block:: bash

    git clone git://github.com/CartoDB/CartoDB-SQL-API.git
    cd CartoDB-SQL-API
    git checkout master

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

    git clone git://github.com/CartoDB/Windshaft-cartodb.git
    cd Windshaft-cartodb
    git checkout master

* Install npm dependencies

  .. code-block:: bash
  
    npm install

.. warning::
    If this fails due to package cairo not found in the pkg-config search path, you can install it like this

    ::

        $  sudo apt-get install libpango1.0-dev

    After this change, re-run npm install, and it should be OK.
  


* Create configuration. The name of the filename of the configuration must be the same than the environment you are going to use to start the service. Let's assume it's development.

  .. code-block:: bash
  
    cp config/environments/development.js.example config/environments/development.js

  
* Start the service. The second parameter is always the environment of the service. Remember to use the same you used in the configuration.

  .. code-block:: bash

    node app.js development


Ruby
----

* Download ruby-install. Ruby-install is a script that makes ruby install easier. It's not needed to get ruby installed but it helps in the process.

  .. code-block:: bash

    wget -O ruby-install-0.5.0.tar.gz https://github.com/postmodern/ruby-install/archive/v0.5.0.tar.gz
    tar -xzvf ruby-install-0.5.0.tar.gz
    cd ruby-install-0.5.0/
    sudo make install

* Install some ruby dependencies

  .. code-block:: bash

    sudo apt-get install libreadline6-dev openssl
  
* Install ruby 2.2.3. CartoDB has been deeply tested with Ruby 2.2.

  .. code-block:: bash

    sudo ruby-install ruby 2.2.3

* Ruby-install will leave everything in /opt/rubies/ruby-2.2.3/bin. To be able to run ruby and gem later on, you'll need to add the Ruby 2.2.3 bin folder to your PATH variable. It's also a good idea to include this line in your bashrc so that it gets loaded on restart

  .. code-block:: bash

    export PATH=$PATH:/opt/rubies/ruby-2.2.3/bin

* Install bundler. Bundler is an app used to manage ruby dependencies. It is needed by CartoDB's editor

  .. code-block:: bash

    sudo gem install bundler


* Install compass. It will be needed later on by CartoDB's editor

  .. code-block:: bash

    sudo gem install compass


Editor
------

* Download the editor code

  .. code-block:: bash

    git clone --recursive https://github.com/CartoDB/cartodb.git
    cd cartodb

* Install pip

  .. code-block:: bash

    sudo wget  -O /tmp/get-pip.py https://bootstrap.pypa.io/get-pip.py
    sudo python /tmp/get-pip.py

* Install a necessary package for python dependencies

  .. code-block:: bash

   sudo apt-get install python-all-dev


* Install dependencies

  .. code-block:: bash
  
    sudo apt-get install imagemagick unp zip
    RAILS_ENV=development bundle install
    npm install
    sudo pip install --no-use-wheel -r python_requirements.txt

.. warning::
    If this fails due to the installation of the gdal package not finding Python.h, you'll need to do this:

    ::

        export CPLUS_INCLUDE_PATH=/usr/include/gdal
        export C_INCLUDE_PATH=/usr/include/gdal
        export PATH=$PATH:/usr/include/gdal

  After this, re-run the pip install command, and it should work. If gdal keeps failing, see more information here: http://gis.stackexchange.com/questions/28966/python-gdal-package-missing-header-file-when-installing-via-pip
  
* Add the grunt command to the PATH

  .. code-block:: bash
    
    export PATH=$PATH:$PWD/node_modules/grunt-cli/bin

* Install all necesary gems

  .. code-block:: bash
    
    bundle install


* Precompile assets. Note that the last parameter is the environment used to run the application. It must be the same used in the Maps and SQL APIs

  .. code-block:: bash
    
    bundle exec grunt --environment development


* Create configuration files

  .. code-block:: bash

    cp config/app_config.yml.sample config/app_config.yml
    cp config/database.yml.sample config/database.yml

* Initialize the metadata database

  .. code-block:: bash
  
    RAILS_ENV=development bundle exec rake db:setup
    RAILS_ENV=development bundle exec rake db:migrate

* Create an admin user

  .. code-block:: bash

    RAILS_ENV=development bundle exec rake db:setup_user

* Start the redis-server that allows access to the SQL and Maps APIs:

  .. code-block:: bash

    redis-server &

* Start the editor HTTP server

  .. code-block:: bash

    RAILS_ENV=development bundle exec rails server

* In a different process/console start the resque process

  .. code-block:: bash
  
    RAILS_ENV=development bundle exec ./script/resque
