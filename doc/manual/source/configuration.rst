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

.. highlight:: yml

::

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
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href= "http://cartodb.com/attributions#basemaps">CartoDB</a>'
          dark_matter_rainbow:
            url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            subdomains: 'abcd'
            minZoom: '0'
            maxZoom: '18'
            name: 'Dark matter'
            className: 'dark_matter_rainbow'
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>'
          positron_lite_rainbow:
            url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
            subdomains: 'abcd'
            minZoom: '0'
            maxZoom: '18'
            name: 'Positron (lite)'
            className: 'positron_lite_rainbow'
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>'

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

.. highlight:: yml

::

    positron_rainbow:
      default: true
      url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      subdomains: 'abcd'
      minZoom: '0'
      maxZoom: '18'
      name: 'Positron'
      className: 'positron_rainbow'
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href= "http://cartodb.com/attributions#basemaps">CartoDB</a>'
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

- For a default installation, **app_config.yml** contains this relevant values:
    .. highlight:: yml

    ::

        session_domain:     '.localhost.lan'
        subdomainless_urls: false

- To activate subdomainless urls, change to (notice the removed starting dot from session_domain:
    .. highlight:: yml

    ::

        session_domain:     'localhost.lan'
        subdomainless_urls: true


- Non-default HTTP and HTTPs ports can also be configured here for REST API calls, with the following **app_config.yml** attributes:
    .. highlight:: yml

    ::

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

Developer info
--------------
To support this options, you **should not** use standard Rails ``_url`` and ``_path`` routing helper
methods. Instead, you have available this methods:

- Method 1 (``CartoDB.base_url``)
    .. highlight:: yml

    ::

        # Warning, if subdomains are allowed includes the username as the subdomain,
        #  but else returns a base url WITHOUT '/u/username'
        CartoDB.base_url(subdomain, org_username=nil, protocol_override=nil)

- Method 2 (``CartoDB.url``)
    .. highlight:: yml

    ::

        # Helper method to encapsulate Rails full URL generation compatible with our subdomainless mode
        # @param context ActionController::Base or a View or something that holds a request
        # @param path String Rails route name
        # @param params Hash Parameters to send to the url (Optional)
        # @param user User (Optional) If not sent will use subdomain or /user/xxx from controller request
        CartoDB.url(context, path, params={}, user = nil)

- Method 3 (``CartoDB.path``)
    .. highlight:: yml

    ::

        # Helper method to encapsulate Rails URL path generation compatible with our subdomainless mode
        # @param controller ActionController::Base
        # @param path String Rails route name
        # @param params Hash Parameters to send to the url (Optional)
        CartoDB.path(controller, path, params={})

``CartoDB.base_url`` Only generates the hostname and path up until ``/user/xxxx``
or ``/u/xxxx``, so it is meant for scenarios when you want only the hostname,
or wish to do some advanced URL crafting (usually concatenating with a
``CartoDB.path``). Its syntax is less smart than .url and .path, so use with care.

``CartoDB.url`` Generates a full URL. If you don't care or want to support multiuser,
user param can be ignored, but if must be compatible with multiuser you have
to specify a User instance (which most times will be ``current_user``). By specifying
the ``User`` instance, it will check if the user belongs or not to an organization and
craft the appropiate URL. This is the recommended function to use when doing tasks
like building Rails ``forms``, performing ``redirect_to`` calls and similar tasks.

``CartoDB.path`` Generates a URL path **after** the ``/u/xxxx`` or ``/user/xxxx`` fragment
(e.g. ``cartodb.com/u/USER/ACTION/ID`` -> ``ACTION/ID``). This is useful when you
already have the hostname somewhere else (e.g. CartoDB's javascript libraries
store the logged in user hostname at ``user_data.base_url`` and use it as a base for
many URLs).
