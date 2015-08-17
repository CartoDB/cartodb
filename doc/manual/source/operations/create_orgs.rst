Creating organizations
======================

To create a new organization, a rake task called ``create_new_organization_with_owner`` is used. For this task to work properly, a user **created beforehand** must be provided as an owner (if you're not sure how to create a user, refer to "Creating Users").

In order to create the organization, 4 parameters must be set:

* **Organization name** is a short nickname for the organization, that may only contain letters, numbers and dash (-) characters. For example, 'cartodb' would be OK.
* **Organization display name** is a longer, more beautiful name for the organization. It may contain any characters needed. For example, 'CartoDB Inc.'.
* **Organization seats** is the number of users that will be able to be created under the organization. For example, 5 seats will mean that a maximum of 5 users can belong to the organization.
* **Organization quota** is the space quota in **bytes** that the organization is assigned. For example, 1024 * 1024 * 1024 is 1GB of quota.
* **Owner's user name** is the user name of the owner of the organization. In our example, let's assume that our user name is 'manolo'.

Taking into account the previous information, creating an organization owned by 'manolo', named 'CartoDB Inc.', referred to as 'cartodb', with 5 seats and a 1GB quota, is just running the following command:

``bundle exec rake cartodb:db:create_new_organization_with_owner ORGANIZATION_NAME="cartodb" ORGANIZATION_DISPLAY_NAME="CartoDB Inc." ORGANIZATION_SEATS="5" ORGANIZATION_QUOTA="1073741824" USERNAME="manolo"``
