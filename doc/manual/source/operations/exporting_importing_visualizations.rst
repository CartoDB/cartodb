Exporting/Importing visualizations
==================================

You might be interested in exporting and importing visualizations because of several reasons:

* Backup purposes.
* Moving visualizations between different hosts.
* Moving visualizations between users.
* Using the same visualization with different data.

With ``cartodb:vizs:export_user_visualization_json`` task you can export a visualization to JSON, and with ``cartodb:vizs:import_user_visualization_json`` you can import it. First outputs to stdout and second reads stdin.

This example exports ``c54710aa-ad8f-11e5-8046-080027880ca6`` visualization.

.. code-block:: bash

  $ bundle exec rake cartodb:vizs:export_user_visualization_json['c54710aa-ad8f-11e5-8046-080027880ca6'] > c54710aa-ad8f-11e5-8046-080027880ca6.json

and this imports it into ``6950b745-5524-4d8d-9478-98a8a04d84ba`` user, who is in another server.

.. code-block:: bash

  $ cat c54710aa-ad8f-11e5-8046-080027880ca6.json | bundle exec rake cartodb:vizs:import_user_visualization_json['6950b745-5524-4d8d-9478-98a8a04d84ba']

Please keep in mind the following:

* Exporting has **backup purposes**, so it keeps ids. If you want to use this to replicate a visualization in the same server you can edit the JSON and change the ids. Any valid, distinct UUID will work.
* It **does export neither the tables nor its data**. Destination user should have tables with the same name than the original one for the visualization to work. You can change the table names in the JSON file if names are different.

Exporting/Importing full visualizations
=======================================

*Disclaimer: this feature is still in beta*

You can export a complete visualization (data, metadata and map) with this command: ``bundle exec rake cartodb:vizs:export_full_visualization['5478433b-b791-419c-91d9-d934c56f2053']``

That will generate a `.carto` file that you can import in any CartoDB installation just dropping the file as usual.
