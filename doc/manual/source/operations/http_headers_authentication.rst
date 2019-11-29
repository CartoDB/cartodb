HTTP Header Authentication
==================================

With web servers such as NGINX or others you can perform SSO by making the web server add a trusted, safe header to every request sent to CARTO. Example:

User browser -- ``GET http://myorg.mycompany.lan/dashboard`` --> NGINX (adds ``'sso-user-email': 'alice@myorg.com'`` header) --> CARTO server

You can enable HTTP Header Authentication at CARTO by adding the following to ``app_conf.yml`` (taken from ``app_conf.yml.sample``):

.. code-block:: Ruby

  http_header_authentication:
    header: # name of the trusted, safe header that your server adds to the request
    field: # 'email' / 'username' / 'id' / 'auto' (autodetection)
    autocreation: # true / false (true requires field to be email)

Configuration for the previous example:

.. code-block:: Ruby

  http_header_authentication:
    header: 'sso-user-email'
    field: 'email'
    autocreation: false

Autocreation
------------

Even more, if you want not only *authentication* (authenticating existing users) but also *user creation* you can turn ``autocreation`` on by setting ``autocreation: true``. If you do so, when a user with the trusted header performs their first request the user will be created automatically. This feature requires that ``field`` is set to ``email``, since the new user will be created with it:

* ``email``: value of the header (``alice@myorg.com``).
* ``username``: user of the email ( ``alice``).
* ``password``: random. they can change it in their account page.
* ``organization``: taken from the subdomain (``myorg``).
