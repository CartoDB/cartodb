Configuration
=============

In this section you can find some helpful configuration examples related with **Basemaps**,
**Domainles Urls** and **Common-data**.

Basemaps
--------

The way to add/change the basemaps available in CartoDB is chaging the
config/app_config.yml. Basically you need to add a new entry called basemaps,
that entry can have different sections and each section one or more basemaps.

Each section corresponds to row in CartoDB basemap dialog. If the basemaps entry
is not present a set of default basemaps will be used (CartoDB and Stamen ones,
check the default basemaps file
https://github.com/CartoDB/cartodb/blob/master/lib/assets/javascripts/cartodb/table/default_layers.js)

Also, it's always necessary to have a default basemap among all the confifured
ones in the app_config.yml. The way to set a basemap as default a "default"
attribute needs to be added to the basemap. There can be several basemaps in the
config with the attribute default set, however, only the first one found in the
same order than in the app_config will be used as default.

Here is an example config.yml:

.. code-block:: yaml

  basemaps:
      CartoDB:
        positron_rainbow:
          default: true # Ident with spaces not with tab
          url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          subdomains: 'abcd'
          minZoom: '0'
          maxZoom: '18'
          name: 'Positron'
          className: 'positron_rainbow'
          attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href= "https://cartodb.com/attributions">CartoDB</a>'
        dark_matter_rainbow:
          url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          subdomains: 'abcd'
          minZoom: '0'
          maxZoom: '18'
          name: 'Dark matter'
          className: 'dark_matter_rainbow'
          attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://cartodb.com/attributions">CartoDB</a>'
        positron_lite_rainbow:
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
          subdomains: 'abcd'
          minZoom: '0'
          maxZoom: '18'
          name: 'Positron (lite)'
          className: 'positron_lite_rainbow'
          attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://cartodb.com/attributions">CartoDB</a>'

      stamen:
        toner_stamen:
          url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
          subdomains: 'abcd'
          minZoom: '0'
          maxZoom: '18'
          name: 'Toner'
          className: 'toner_stamen'
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'

Basemaps with a layer of labels
-------------------------------
Basemaps can optionally add a layer with labels on top of other layers. To do so,
you should add the labels key to the basemap config, as follows:

.. code-block:: yaml

  positron_rainbow:
    default: true
    url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
    subdomains: 'abcd'
    minZoom: '0'
    maxZoom: '18'
    name: 'Positron'
    className: 'positron_rainbow'
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href= "https://cartodb.com/attributions">CartoDB</a>'
    labels:
      url: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'

Domainless URLs
---------------

Historically, CartoDB URLs were based on a ``username.cartodb.com/PATH`` schema.
When Multiuser accounts were introduced, an alternate schema
``organizationname.cartodb.com/u/username/PATH`` was built alongside the "classic" one.
Both schemas introduce some problems for opensource and/or custom installs of the platform,
as they require DNS changes each time a new user or organization is added.

Subdomainless urls are the answer to this problems. Modifying some configuration settings,
any CartoDB installation can be setup to work with a new schema, ``cartodb.com/user/username/PATH.``

The following sections details the steps to make it work and the limitations it has.

Configuration changes for Domainless URLs
------------------------------------------

* For a default installation, **app_config.yml** contains this relevant values:

  .. code-block:: yaml

    session_domain:     '.localhost.lan'
    subdomainless_urls: false

* To activate subdomainless urls, change to (notice the removed starting dot from session_domain:

  .. code-block:: yaml

    session_domain:     'localhost.lan'
    subdomainless_urls: true


* Non-default HTTP and HTTPs ports can also be configured here for REST API calls, with the following **app_config.yml** attributes:

  .. code-block:: yaml

    # nil|integer. HTTP port to use when building urls.
    # Leave empty to use default (80)
    http_port:
    # nil|integer. HTTPS port to use when building urls.
    # Leave empty to use default (443)
    https_port:

Remember that as with other configuration changes, Rails application must be restarted to apply them.

Limitations
-----------
If you leave the dot at ``session_domain`` having subdomainless urls, you will be forced
to always have a subdomain. Any will do, but must be present. If you remove the dot it
will work as intended without any subdomain.

When subdomainless urls are used, organizations will be ignored from the urls. In fact,
typing ``whatever.cartodb.com/user/user1`` and ``cartodb.com/user/user1`` is the same. The platform
will replicate the sent subdomain fragment to avoid CORS errors but no existing organization
checks will be performed. You should be able to use them, assign quota to the organization users, etc.

Common Data
-----------
This service uses the visualizations API to retrieve all the public datasets from a defined user and
serve them as importable datasets to all the users of the platform through the data library options.

All can be configured through the ``common_data`` settings section. If the ``base_url``
option is set, this will be the base url the service is going to use to build the URL to retrieve datasets.
For example:

.. code-block:: yaml

  common_data:
    protocol: 'https'
    username: 'common-data'
    base_url: 'https://common-data.cartodb.com'
    format: 'shp'


Use ``https://common-data.cartodb.com`` as the base url to retrieve all the public datasets from that user.

This is the default behaviour in CartoDB, but if you want to use your own system and user for this purpose you
have to define the ``username`` property pointing to the user that will provide the datasets in your own instance.
The URL in this case is going to be built using your instance base url. For example if your instance base url is
``http://www.example.com`` and the config is:

.. code-block:: yaml

  common_data:
    protocol: 'https'
    username: 'common-data-user'
    format: 'shp'

the system populates the data library with the public datasets from ``http://common-data-user.example.com...``

The ``format`` option is used to define the format of the file generated when you are importing one datasets from
the data library. When you import a dataset it uses a stored URL to download that dataset as a file, in the format
defined in the config, and import as your own dataset.
