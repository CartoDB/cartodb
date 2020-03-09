Creating users
==============

Creating users in CARTO is simple thanks to the ``create_dev_user`` script located in ``scripts/create_dev_user``. To execute this script, be sure to be located at the cartodb repository root directory and simply run:

.. code-block:: bash

  $ ./script/create_dev_user

You will be prompted to input two parameters:

* **subdomain** is the same as the user's user name. This is what you will enter in the browser to access the user's dashboard: ``https://<user_name>.carto.com``. Set it to whatever you want the user's user name to be.
* **password** this is the password the new user will use to login into their account.

Upon script completion, the new user will have been created.
