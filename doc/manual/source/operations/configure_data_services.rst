Configuring Dataservices
========================

The services provided by the `Dataservices SQL extension <https://github.com/CartoDB/dataservices-api>`_
can be manually configured for users or organizations through the following rake tasks.

The service configuration is stored in the users and organization metadata tables and reflected in the REDIS configuration database.

Service provider
----------------

For each basic service class (``geocoder``, ``routing``, ``isolines``) a provider can be assigned with the tasks:

* ``cartodb:services:set_user_provider[username,service,provider]``
* ``cartodb:services:set_organization_provider[orgname,service,provider]``

Valid providers are:

* ``mapzen`` for Mapzen-based third party services (Mapzen Search/Mapzen Mobility)
* ``here`` for HERE maps third party services (HERE Geocoder/Routing APIs)
* ``google`` for Google Maps services

Examples:
`````````

Set geocoder provider for user ``user-name`` to Mapzen::

    rake cartodb:services:ser_user_provider['user-name',geocoder,mapzen]

Set geocoder provider for organization ``org-name`` to Mapzen::

    rake cartodb:services:ser_organization_provider['org-name',geocoder,mapzen]

Quotas
------

Service limits can be established for individual users or organizations in the form of quotas (maximum number of requests per billing period).
The next tasks manage the configuration of the quotas.

* ``cartodb:services:set_user_quota[username,service,quota]``
* ``cartodb:services:set_org_quota[orgname,service,quota]``

Quota values must be non-negative integers.

Valid services are:

* ``geocoding`` for street-level (hi-res) geocoding services.
* ``here_isolines`` for general isolines/isochrones zoning services (despite the name, this does not only applies to Here-provided services).
* ``obs_snapshot`` for Data Observatory *snapshot* services.
* ``obs_general`` for Data Observatory general services.
* ``mapzen_routing`` for general routing services (again, not necessarily provided by Mapzen).


Examples:
`````````

Set geocoding quota for user ``user-name`` to 1000 monthly requests::

    rake cartodb:services:set_user_quota['user-name',geocoder,1000]

Set geocoder quota for organization ``org-name`` to 1000 monthly requests::

    rake cartodb:services:set_org_quota['org-name',geocoder,1000]

Soft limits
-----------

The service limits for a user can be configured to be *soft*, meaning that the user can exceed the limits (possibly incurring in additional charges).
So, when soft limits is set to `false` (the default) and the limits are exceeded, service requests will fail,
while if the soft limits are set to `true` requests will succeed (and the user will be charged for the excess).

* ``cartodb:services:set_user_soft_limit[username,service,soft_limit_status]``

The possible values for the soft limits status is either ``true`` or ``false``.

Valid services are, as for the quota configuration:

* ``geocoding`` for street-level (hi-res) geocoding services.
* ``here_isolines`` for general isolines/isochrones zoning services (despite the name, this does not only applies to Here-provided services).
* ``obs_snapshot`` for Data Observatory *snapshot* services.
* ``obs_general`` for Data Observatory general services.
* ``mapzen_routing`` for general routing services (again, not necessarily provided by Mapzen).

Examples:
`````````

Activate soft geocoding limits for user ``user-name``::

    rake cartodb:services:set_user_soft_limit['user-name',geocoder,true]

Disable soft geocoding limits for user ``user-name``::

    rake cartodb:services:set_user_soft_limit['user-name',geocoder,false]
