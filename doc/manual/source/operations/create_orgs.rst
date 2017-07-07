Creating organizations
======================

To create a new organization, a rake task called ``create_new_organization_with_owner`` is used. For this task to work properly, a user **created beforehand** must be provided as an owner (if you're not sure how to create a user, refer to "Creating Users").

In order to create the organization, 4 parameters must be set:

* ``ORGANIZATION_NAME`` is a short nickname for the organization, that may only contain letters, numbers and dash (-) characters. For example, 'cartodb' would be OK.
* ``ORGANIZATION_DISPLAY_NAME`` is a longer, more beautiful name for the organization. It may contain any characters needed. For example, 'CartoDB Inc.'.
* ``ORGANIZATION_SEATS`` is the number of users that will be able to be created under the organization. For example, 5 seats will mean that a maximum of 5 users can belong to the organization.
* ``ORGANIZATION_QUOTA`` is the space quota in **bytes** that the organization is assigned. For example, 1024 * 1024 * 1024 is 1GB of quota.
* ``USERNAME`` is the user name of the owner of the organization. In our example, let's assume that our user name is 'manolo'.

This task is executed like:

.. code-block:: bash

  $ bundle exec rake cartodb:db:create_new_organization_with_owner ORGANIZATION_NAME="<org_name>" ORGANIZATION_DISPLAY_NAME="<org_display_name>" ORGANIZATION_SEATS="<org_seats>" ORGANIZATION_QUOTA="<org_quota>" USERNAME="<username>"


and an example execution for creating an organization owned by 'manolo', named 'CartoDB Inc.', referred to as 'cartodb', with 5 seats and a 1GB quota, would be:

.. code-block:: bash

  $ bundle exec rake cartodb:db:create_new_organization_with_owner ORGANIZATION_NAME="cartodb" ORGANIZATION_DISPLAY_NAME="CartoDB Inc." ORGANIZATION_SEATS="5" ORGANIZATION_QUOTA="1073741824" USERNAME="manolo"

Seats
-----

You can change the viewer seats:

.. code-block:: bash

  $ bundle exec rake cartodb:db:set_organization_viewer_seats["<org_name>","<viewer_seats>"]
