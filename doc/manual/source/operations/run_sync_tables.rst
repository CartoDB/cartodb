Running Sync Tables
==============

If you are working with the **Sync Tables** feature, you must run a rake task to trigger the synchronization of the dataset. This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque:

.. highlight:: bash

::

    bundle exec rake cartodb:sync_tables[true]

You might want to set up a cron so that this task is executed periodically in an automated way.



