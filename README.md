# CartoDB #

## Introduction ##

[CartoDB](https://github.com/Vizzuality/cartodb) is a HTTP wrapper for a PostgreSQL + PostGIS database. It is composed of different components:

  - PostgreSQL + PostGIS database: a dedicated postgresql database with geospatial functionalities
  - User Interface: allows the user to create and manage tables, and their data, import new ones, or export them to files
  - Pure SQL API endpoint: JSON API which allow users to run SQL queries and get their response in JSON format 

  
## Components ##

### PostgreSQL + PostGIS database ###

Each CartoDB user has his own postgresql database, totally isolated from the other users databases, which extra geospatial functionalities provided by PostGIS. The users can, basically, do what they want in his database, there are no limitations.

### User Interface ###

The UI is a front-end layer on the top of the database which helps the users to create new tables, and to manage the data from those tables. Also, the users can get the OAuth tokens to use the API from the interface.

This UI uses internally a REST API, which is only for internal use.

Also, all the import/export functionality has been externalized to a Ruby gem named [cartodb-importer](https://github.com/Vizzuality/cartodb-importer).

Both, UI and REST API, are implemented using Ruby on Rails.

### Pure SQL API ###

SQL API allows the users to use their databases via HTTP requests and get a response in JSON format. 

This component runs in Node.JS.


## Setting-up the environment for developers ##

### First time ###

  - Install Ruby 1.9.2
  
  - Install Node.JS and Npm, following these steps: <https://github.com/joyent/node/wiki/Installation>

  - Install PostgreSQL, PostGIS, GDAL, and Geo.

  - Install Redis from <http://redis.io/download> or using Homebrew.
  
  - Python dependencies:
    
    - Python setup tools, install from <http://pypi.python.org/pypi/setuptools>

    - Python GDAL, install from <http://pypi.python.org/pypi/GDAL/>

    - Python Chardet: install from <http://chardet.feedparser.org/download/>

    - Python ArgParse: install from <http://code.google.com/p/argparse/>

    - Brewery:

          $ git clone git://github.com/Stiivi/brewery.git
          $ python setup.py install
          
    - Alternatively we can use pip installer to install them all with:

          easy_install pip
          pip install -r python_requirements.txt
      
      Note: If compilation fails (it did for gdal module raising a Broken pipe error) try doing "export ARCHFLAGS='-arch i386 -arch x86_64'" first

  - Setup new hosts in `/etc/hosts`:
      
        # CartoDB
        127.0.0.1 api.localhost.lan developers.localhost.lan localhost.lan
        127.0.0.1 testhost.lan api.testhost.lan developers.testhost.lan
        # # # # #
        
  - Clone the [Node SQL API](https://github.com/tokumine/cartodb-sql-api) in your projects folder:
  
        git clone git@github.com:tokumine/cartodb-sql-api.git
  
  - Clone the main repository in your projects folder:
  
        git clone git@github.com:Vizzuality/cartodb.git
        
  - Change to cartdb/ folder and `rvm` will require to create a new gemset. Say **yes**. If not, you must create a gemset for Ruby 1.9.2:
  
        rvm use 1.9.2@cartodb --create
        
  - Run `bundle`:
  
        bundle install --binstubs
        
  - Run Redis:
  
        cd /tmp
        redis-server
        
  - Run `rake cartodb:db:setup`

### Every day usage ###
  
  - Check if Redis is running, if not `cd /tmp; redis-server`

  - Change to CartoDB directory
  
  - Run `rake db:reset` if you want to reset your data and load the databa from `seeds.rb` file
  
  - Run a Rails server in port 3000: `rails s`

  - In a separate tab run a Rails server in port 3001 for REST API: `rails s -p 3001`
  
  - In a separate tab change to Node SQL API folder and run node.js: `node app.js developement`

  - Open your browser and go to `http://localhost.lan:3000`
  
  - Enjoy
  
