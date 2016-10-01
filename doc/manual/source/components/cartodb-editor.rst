CartoDB Editor
==============

The editor is the web management component of CartoDB. Within the editor you can find all the features available in CartoDB. These are some of the most significant tasks you can do with the editor:

  - User management. Credentials, authorization, personal info and billing.
  - Connect datasets to your CartoDB account either by importing your datasets or other ones publicly available.
  - Create maps from your datasets
  - Publising and permissions management of datasets and maps
  - Synchronized tables management

Internally the editor is the operations core of CartoDB. It manages PostgreSQL metadata database, keep some metadata in sync with Redis, manages new datasets import queues with resque, etc..

It is developed in Ruby on Rails and like the other components of CartoDB is Open Source and you can find the source code at `CartoDB/cartodb <https://github.com/CartoDB/cartodb>`_

You can find usage documentation at https://docs.carto.com/cartodb-editor.html

Although you can chechout any branch of the repository most of them are usually work in progress that is not guaranteed to work. In order to run a production ready Editor service you need to use **master** branch.

Service modes
-------------

The code of CartoDB editor needs to run in two different modes. HTTP server mode and background jobs mode.

The **HTTP server** processes the http requests sent to the service and returns a response synchronously. Any ruby rack server can be used to start the editor in this mode. Some examples of rack servers are mongrel, webrick, thin or unicorn.

The **background jobs** mode is started with `resque <https://github.com/resque/resque>`_. In this mode the service keep polling some redis keys in order to find pending background jobs. When it finds one, it processes it and change the state of the job in redis. CartoDB uses this mode for different type of jobs like datasets imports or synchronized tables.
