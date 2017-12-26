Testing CartoDB
===============

Easy way
--------

Just run "make check".

Detailed way
------------

CartoDB tests are based on [Ruby Spec](http://rspec.info/).
The procedure to run them is as follows:

  # Prepare test database
  bundle exec rake cartodb:test:prepare

  # Run all specs
  bundle exec rspec


If you want to run specific tests, rather than all of them, you
can specify them on the `rspec` command line, like:

  bundle exec rspec spec/lib/sql_test_spec.rb


To avoid wasting time and resources creating once and again test users,
if you require 'spec_helper' you have two "global test users" for the whole suite to use,
$user_1 and $user_2. Just take care to not destroy or leave them in inconsistent state between test batteries.

You can also use the following `runParallelTests.sh` script to run the tests in a multithreaded way.
Run `script/ci/runParallelTests.sh X` where X is a number of threads to use.

Troubleshooting
---------------

Common system configuration issues are reported in this section.

 - "No such user: test_cartodb_user_###"

   Make sure test.port in config/database.yml is not pointing to
   pg_bouncer, as dynamically created database roles aren't easily
   supported by it (you'd need to explicitly list allowed usernames,
   and over 70 new users are created during a full testsuite run).


Speeding up test runs (NOTE: Untested since a long time, might not work)
------------------------------------------------------------------------

CartoDB is a large app.
We recommend you use the [spin gem](https://github.com/jstorimer/spin/)
to load the main application into memory while you are testing.
TODO: document how
