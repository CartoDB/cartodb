Chaging limits
==============

This section explains how to use rake tasks to change several limits for users.

Change user import limits
-------------------------

Using the rake task ``set_custom_limits_for_user``, you can change import limits for a given user. The parameters this task takes are:

* ``user_name`` is the user name of the user for whom these limits will be changed.
* ``import_file_size`` is the maximum size in **bytes** for a file to be imported.
* ``table_row_count`` is the maximum number of rows for a file to be imported.
* ``concurrent_imports`` is the maximum number of concurrent imports that can be handled at once.



This task is executed like:

``bundle exec rake cartodb:set_custom_limits_for_user[<user_name>,<import_file_size>,<table_row_count>,<concurrent_imports>]``

and an example execution could be:

``bundle exec rake cartodb:set_custom_limits_for_user["manolo","1048576","50000","5"]``

Increasing Twitter imports limit
--------------------------------

Increasing the Twitter imports limit should done using rake task ``increase_limits_for_twitter_import_users``. This rake task takes no parameters. Upon execution, all users with Twitter imports enabled will have **1500MB of filesize quota** and a **5M row quota** limit.

