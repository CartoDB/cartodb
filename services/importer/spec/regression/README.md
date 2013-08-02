Importer regression tests
-------------------------
To make this work, create the file ../factories/database.json with the correct
configuration to the PostgreSQL DB (see ../factories/database.json.sample).

Then you just need to run:

`ruby regression.rb`

It will automatically test importing all the files on the files/ folder.

To choose a different folder use:

`TEST_FOLDER=/home/me/my_files/ ruby regression.rb`

