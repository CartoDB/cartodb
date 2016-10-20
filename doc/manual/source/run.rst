Running CartoDB
===============

First run, setting up an user
-----------------------------

First run, setting up first time to run your development version of CartoDB. Let's suppose that we are going to create a development env and that our user/subdomain is going to be 'development'

.. highlight:: bash

::

    cd cartodb
    export SUBDOMAIN=development

    # Add entries to /etc/hosts needed in development
    echo "127.0.0.1 ${SUBDOMAIN}.localhost.lan" | sudo tee -a /etc/hosts

    # Create a development user
    sh script/create_dev_user


Running all the processes
-------------------------

Start the resque daemon (needed for import jobs):

.. highlight:: bash

::

    bundle exec script/resque

Finally, start the CartoDB development server on port 3000:

.. highlight:: bash

::

   bundle exec thin start --threaded -p 3000 --threadpool-size 5

Node apps

.. highlight:: bash

::

    cd cartodb-sql-api && node app.js
    cd windshaft-cartodb && node app.js


You should now be able to access
**`http://<mysubdomain>.localhost.lan:3000`**
in your browser and login with the password specified above.

Enjoy
