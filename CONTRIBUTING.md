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

_Don't forget to restart Rails after you have modified `config/app_config.yml`._

# Documentation

Documentation that don't fit well inline (e.g. high-level stuff) should be placed in the [/doc directory](doc/README.md).

# Frontend

The frontend is really standalone code, but is integrated with/served by the Rails application.

## CSS

We use [SASS](http://sass-lang.com/), with [.scss](http://www.thesassway.com/editorial/sass-vs-scss-which-syntax-is-better) format, which are located at ```app/assets/stylesheets```. [Grunt](http://gruntjs.com/) is used to compile the files into ```.css``` files, instead of the default Sprockets pipeline that Rails provide.

See [doc/frontend/README.md](doc/frontend/README.md) for more in-depth documentation.

Also CartoDB makes use of a linter machine for checking possible errors in those stylesheets.
Rules are specified in the [scss-style.yml](scss-style.yml) file. Once a new Pull Request is started,
[Hound](https://houndci.com/) application will check those SCSS changes for warnings.

## JS

CartoDB is built on top of [CARTO.js](https://github.com/CartoDB/carto.js),
which in turns depends on some common libraries, in particular worth mentioning:

 - [BackboneJS 0.9.2](https://cdn.rawgit.com/jashkenas/backbone/0.9.2/index.html).
 - [jQuery 1.7.2](http://api.jquery.com/category/version/1.7/)
 - [underscore.js 1.4.4](https://cdn.rawgit.com/jashkenas/underscore/1.4.4/index.html)

Source code is located at `lib/assets/javascripts`, dependencies at `vendor/assets/javascripts`.

See [doc/frontend/README.md](doc/frontend/README.md) for more in-depth documentation.

We apply [semistandard](https://github.com/Flet/semistandard) for syntax consistency of all new code at least, it's checked as part of test run. It's recommended to use [a linter in your IDE of choice](https://github.com/Flet/semistandard#editor-plugins).

Until our guidelines are publically available follow the existing file/directory and style structure.

### Update CartoDB.js v3

Follow these steps to update to get latest changes:

- go to `lib/assets/javascripts/cdb/`
- `git checkout develop && git pull`
- go back to root and run `grunt cdb`
- commit both the new revision of the submodule and the generated file `vendor/assets/javascripts/cartodb.uncompressed.js`

### Writing & running tests

We use
 - [Jasmine 2.1](jasmine.github.io/2.1/introduction.html) as test framework
 - [SinonJS 1.3.4](sinonjs.org) for test spies/stubs/mocks when Jasmine spies isn't good enough

There are two test suites: one for the old Editor and one for Builder.

The old Editor specs reside in `lib/assets/test/spec/cartodb`.

The core Builder specs reside in `lib/assets/test/spec/builder`.

#### Running all tests

To check all the application specs, please run the next command through command line.

```bash
grunt test
```

This grunt task pass both Editor and Builder suites and the linting process.

Run this task to be sure that everything is OK.

#### Old Editor specs

In order to develop tests for the codebase outside Builder (that is, old Editor and dashboard pages) we advise to run:

```bash
grunt editor_specs
```

After the building process finish, a webpage will show up with a link to the Jasmine page with all the specs. The URL of this page is `http://localhost:8089/_SpecRunner.html`

Then, the process will watch changes in the codebase and will regenerate the specs as needed. Just refresh the Jasmine page to pass again the tests.

**Run specs and regular codebase simultaneously**

If you want to run simultaneously the application and the specs generation follow these steps:

1. Open a terminal with Node v6.9.2 (use nvm) and run `grunt dev`. This will build the application assets and will watch for changes.

2. Open a second terminal and run `grunt affected_editor_specs`.

3. That's it. When you change any Builder Javascript file `grunt dev` will build the application bundle and `grunt affected_editor_specs` will build the specs.

#### Builder specs

The development of Builder specs is separated from regular development. This means that you can develop new specs or modify the existing ones without having the whole application running. This speeds up the development task.

To start specs development type the next command:

```bash
grunt test:browser:builder
```

You can optionally provide an argument to grunt to filter what specs will be generated, like this:

```bash
grunt test:browser:builder --match=dropdown
```

After building the whole suite for the first time, a web server will be started on port 8088 and the spec runner webpage will show up. If you need to use a different port, change the port & URL values on the [connect task](lib/build/tasks/connect.js)

The process will watch changes in the codebase and will regenerate the specs as needed. Just refresh the Jasmine page to pass again the tests.

**Run specs and regular codebase simultaneously**

If you want to run simultaneously the application and the specs generation follow these steps:

1. Open a terminal with Node v6.9.2 (use nvm) and run `grunt dev`. This will build the application assets and will watch for changes.

2. Open a second terminal and run `grunt test:browser:builder`.

3. That's it. When you change any Builder Javascript file `grunt dev` will build the application bundle and `grunt test:browser` will build the specs.

#### Running a particular spec

If you only want to run a subset of tests the easiest and fastest way is to use [focused specs](jasmine.github.io/2.1/focused_specs.html), but you can also append  `?spec=str-matching-a-describe` to test URL, or use [--filter flag](https://github.com/gruntjs/grunt-contrib-jasmine#filtering-specs) if running tests in a terminal.

## Grunt

We use [Grunt](http://gruntjs.com/) to automate build tasks related to both CSS and JS.

We use v6.9.2 of [node](http://nodejs.org/) (we recommend to use [NVM](https://github.com/creationix/nvm)).

Install dependencies using a normal npm install as such:
```bash
npm install
npm install -g grunt-cli
```

Run `grunt availabletasks` to see available tasks.

First time starting to work you need to run `grunt dev`, to build all necessary frontend assets (will be written to `public/assets/:version`).

```bash
grunt dev
```

That enables CSS and JS watchers for rebuilding bundles automatically upon changes.

**Note!** Make sure `config/app_config.yml` don't contain the `app_assets` configuration, i.e.:

```ruby
# Make sure the following lines are removed, or commented like this:
#app_assets: 
#  asset_host: '//cartodb-libs.global.ssl.fastly.net/cartodbui'
```

_Don't forget to restart Rails after you have modified `config/app_config.yml`._

## Building static pages

There are some views that can be served from a static file in `public/static/` directory and must be built beforehand. For that purpose run the following command:

```bash
npm run build:static
```

Don't forget to check-in the resulting static files.

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
