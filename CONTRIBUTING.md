The development tracker for CartoDB is on GitHub:
http://github.com/cartodb/cartodb

Bug fixes are best reported as pull requests over there.
Features are best discussed on the mailing list:
https://groups.google.com/d/forum/cartodb

---

1. [General](#general)
2. [Documentation](#documentation)
3. [Frontend](#frontend)
4. [Submitting contributions](#submitting-contributions)

---

# General

Every new feature (as well as bugfixes) should come with a test case. Depending on context different guidelines might
apply, see following sections.

Unless you plan to develop frontend code you can serve assets from our CDN instead, make sure the following is set in
the `config/app_config.yml`:

```ruby
app_assets: 
  asset_host: '//cartodb-libs.global.ssl.fastly.net/cartodbui'
```

Even if you're using CDN assets you still need to run `npm run build:static`.

_Don't forget to restart Rails after you have modified `config/app_config.yml`._

# Documentation

Documentation that don't fit well inline (e.g. high-level stuff) should be placed in the [/doc directory](doc/README.md).

# Frontend

The frontend is really standalone code, but is integrated with/served by the Rails application.

See [doc/frontend/README.md](doc/frontend/README.md) for more in-depth documentation.

# Backend

Backend is a Rails 3 application, there's no specific workflow you must follow to run it.

Every PR should be covered by tests. If you create a new file please add it to `Makefiles`. Useful commands:
- `make check`: prepare the test database and run the full suite (takes a while).
- `make prepare-test-db`: prepare the test database.
- `bundle exec rspec <spec file>`: run a spec.
- `bundle exec rspec <spec file>:<line number>`: run an specific test.

Once a new Pull Request is started,
[Hound](https://houndci.com/) application will check code style and you should fix them as much as possible (with common sense, no need to honor _every_ rule but now most of them are actually useful to make code more readable).

## Submitting contributions

Before opening a pull request (or submitting a contribution) you will need to sign a Contributor License Agreement (CLA) before making a submission, [learn more here](https://carto.com/contributions).

After that, there are several rules you should follow when a new pull request is created:

- Title has to be descriptive. If you are fixing a bug don't use the ticket title or number.
- Explain what you have achieved in the description and choose a reviewer (it has to be a CartoDB team member) of your code. If you have doubts, just ask for one.
- If you change something related with the UI of the application:
  - Add an image or an animation ([LiceCap](https://github.com/lepht/licecap) is your friend) about the feature you have just implemented. Or show the change against what it is already done.
  - Change UI assets version, present in [package.json](package.json) file. Minor if it is a bugfixing or a small feature, major when it is a big change.
- Our linter machine, [Hound](https://houndci.com/), should not trigger any warnings about your changes.
- All tests should pass, both for JS and Ruby.
- The number of modified lines should not exceed 300. If so, please split it into smaller PRs to make it easier to review.

## Development environment accessories

The development environment can be quite slow to start up, but we have some workarounds that help speed it up:
- Using Zeus to avoid the load times of the Rails environment by keeping it into memory. It provides a very fast
  execution of rails commands.
- Using Stellar (database snapshotting tool) in order to quickly reload the test database. This is also useful
  while testing code, in order to quickly rollback to a previous DB state.

### Zeus

1. Install zeus globally with `gem install zeus`. This is recommended but not needed. You can also use `bundle exec zeus`, which is a bit slower.
2. Start the zeus server. `zeus start`. This will start preloading the environments. and display a colorful status.
3. In a different console, run your rails commands prefixed by zeus. For example: `zeus c` for console,
   `zeus rspec xxx` for testing. Run `zeus commands` for a full list (or check `zeus.json`).

Notes:
- If you want to pass ENV variables, pass them to the `zeus start` process (master), not to the slaves.
- When testing, you can run `TURBO=1 zeus start` to enable some extra optimizations for the testing environment
  (less database cleaning).
- If your console breaks after running zeus, add something like `zeus() { /usr/bin/zeus "$@"; stty sane; }` to `.bashrc`.
- If using Vagrant and getting errors, check out [zeus docs](https://github.com/burke/zeus/wiki/Using-with-vagrant).
  Basically, you have to run with `ZEUSSOCK=/tmp/zeus.sock` as an environment variable.

### Stellar

1. Install stellar. Check your distribution packages, or install with pip: `pip install stellar`
2. Create a configuration file by running `stellar init` and following the steps. The connection string is: `postgresql://postgres@localhost/carto_db_test`. The project name doesn't matter.
3. Create a clean testing database `make prepare-test-db`
4. Create a snapshot: `stellar snapshot`

Then to use it for testing, you can pass `STELLAR=stellar` (you can pass the executable path) as an ENV variable and the
testing environment will use it to clean up the database (instead of manually truncating tables).

#### For development

Stellar can also be useful for development, to quickly restore the database to its original configuration. Just create
a different configuration (by going to a different directory, stellar always reads `stellar.yaml` in the current path)
for the development environment.

Then, you can use `stellar snapshot` and `stellar restore` to take and restore snapshot quickly. Also check
`stellar list` to list current db snapshots and `stellar gc` to remove old ones.
