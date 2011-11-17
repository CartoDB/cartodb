# CartoDB #

[CartoDB](http://www.cartodb.com) is a tool for analyzzing, vizzualising and sharing your geospatial data in PostGIS. 

Each CartoDB is owned by its user, and is composed of:

  - User Interface: create and manipulate tables and their data, import new ones, or export them to files
  - PostGIS 2 database: a geospatial database with the full range of Postgres and PostGIS functionality
  - Pure SQL API endpoint: run SQL queries and get responses in JSON, geojson and KML format 
  - Map tiler: A SQL configurable map tile generator for quick feedback on your data, allowing you to style and embed maps 
  - Authentication: Read/Write access to datasets over OAuth with user definable public access if required   
  
Watch some [videos of CartoDB in action](http://www.vimeo.com/channels/cartodb) or try our hosted service, [www.cartodb.com](http://www.cartodb.com). 
  
## Dependencies ##

  - Mapnik 2.0
  - PostGIS 2.0
  - Postgres 9.1.x
  - Redis 2.2+
  - NodeJS 0.4.10+
  - Ruby 1.9.2+
  
## Components of CartoDB ##

  - Data analysis and management interface (this repository)
  - Fully featured SQL API (https://github.com/Vizzuality/CartoDB-SQL-API)
  - High speed map tile generator (https://github.com/Vizzuality/Windshaft-cartodb)


## Setting-up the environment for developers ##

  - Install Ruby 1.9.2
  
  - Install Node.JS and Npm, following these steps: <https://github.com/joyent/node/wiki/Installation> (alternatively you can use `brew instrall node``, but npm has to be installed following the wiki instructions`)

  - Install PostgreSQL, PostGIS, GDAL, and Geo with postgis_template setup
   
  - Install plpython for Python support in PostgreSQL (e.g., `sudo apt-get install postgresql-plpython-9.1`)

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
  


### Coming soon ###

* Better installation instructions
* Simple AMI/Linode images
* Examples and usecases