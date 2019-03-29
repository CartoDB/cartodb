Changing Feature Flags
======================

CARTO uses feature flags, so different users can have access to different features of CARTO. If you would like to enable or disable feature flags to one or all users or to a given organization, you can use the rake tasks described in this section. Feature flag creation and deletion are also covered.


Enabling a feature for all users
--------------------------------

Enabling a feature for all users is done with a rake task called ``enable_feature_for_all_users`` and it takes one parameter.

* ``feature_flag_name`` is the name of the feature flag to be enabled. For example: 'special_dashboard'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_all_users[<feature_flag_name>]

And an example to enable the 'special_dashboard' feature could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_all_users["special_dashboard"]


Enabling a feature for a given user
-----------------------------------

Enabling a feature for a given user is done with a rake task called ``enable_feature_for_user`` and it takes two parameters.

* ``feature_flag_name`` is the name of the feature flag to be enabled. For example: 'special_dashboard'.
* ``user_name`` is the user name of the user to whom the feature flag is to be enabled. For example: 'manolo'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_user[<feature_flag_name>,<user_name>]

.. warning::

  Please be very careful **NOT** to leave a space between parameters, as it will cause rake to spit a ``don't know how to build task`` type error.

And an example to enable the 'special_dashboard' feature for user with user name 'manolo' could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_user["special_dashboard","manolo"]


Enabling a feature for a given organization
-------------------------------------------

Enabling a feature for a given organization is done with a rake task called ``enable_feature_for_organization`` and it takes two parameters.

* ``feature_flag_name`` is the name of the feature flag to be enabled. For example: 'special_dashboard'.
* ``organization_name`` is the internal name ('cartodb' vs 'CartoDB Inc.') to which the feature flag is to be enabled. For example: 'cartodb'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_organization[<feature_flag_name>,<organization_name``

.. warning::

  Please be very careful **NOT** to leave a space between parameters, as it will cause rake to spit a ``don't know how to build task`` type error.

And an example to enable the 'special_dashboard' feature for organization 'cartodb' could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:enable_feature_for_organization["special_dashboard","cartodb"]


Disabling a feature for all users
---------------------------------

Disabling a feature for all users is done with a rake task called ``disable_feature_for_all_users`` and it takes one parameter.

* ``feature_flag_name`` is the name of the feature flag to be disabled. For example: 'special_dashboard'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_all_users[<feature_flag_name>]

And an example to disable the 'special_dashboard' feature could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_all_users["special_dashboard"]


Disabling a feature for a given user
------------------------------------

Disabling a feature for a given user is done with a rake task called ``disable_feature_for_user`` and it takes two parameters.

* ``feature_flag_name`` is the name of the feature flag to be disabled. For example: 'special_dashboard'.
* ``user_name`` is the user name of the user to whom the feature flag is to be disabled. For example: 'manolo'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_user[<feature_flag_name>,<user_name>]

.. warning::

  Please be very careful **NOT** to leave a space between parameters, as it will cause rake to spit a ``don't know how to build task`` type error.

And an example to disable the 'special_dashboard' feature for user with user name 'manolo' could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_user["special_dashboard","manolo"]


Disabling a feature for a given organization
--------------------------------------------

Disabling a feature for a given organization is done with a rake task called ``disable_feature_for_organization`` and it takes two parameters.

* ``feature_flag_name`` is the name of the feature flag to be disabled. For example: 'special_dashboard'.
* ``organization_name`` is the internal name ('cartodb' vs 'CartoDB Inc.') to which the feature flag is to be disabled. For example: 'cartodb'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_organization[<feature_flag_name>,<organization_name``

.. warning::

  Please be very careful **NOT** to leave a space between parameters, as it will cause rake to spit a ``don't know how to build task`` type error.

And an example to disable the 'special_dashboard' feature for organization 'cartodb' could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:disable_feature_for_organization["special_dashboard","cartodb"]


Adding a feature flag
---------------------

Adding feature flags should be done using the rake task called ``add_feature_flag``. This rake task only takes one argument:

* ``feature_flag_name`` is the name of the feature flag to be created.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:add_feature_flag[<feature_flag_name>]

And an example to create a feature flag named "special_dashboard" could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:add_feature_flag["special_dashboard"]


Removing a feature flag
-----------------------

Removing feature flags should be done using the rake task called ``remove_feature_flag``. This rake task only takes one argument:

* ``feature_flag_name`` is the name of the feature flag to be removed.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:remove_feature_flag[<feature_flag_name>]

And an example to remove a feature flag named "special_dashboard" could be:

.. code-block:: bash

  $ bundle exec rake cartodb:features:remove_feature_flag["special_dashboard"]


Listing all feature flags
-------------------------

All existing feature flags can be listed using the rake task called ``list_all_features``.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:features:list_all_features




