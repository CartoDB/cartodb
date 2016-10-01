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

CartoDB is built on top of [CartoDB.js](https://github.com/CartoDB/cartodb.js),
which in turns depends on some common libraries, in particular worth mentioning:

 - [BackboneJS 0.9.2](https://cdn.rawgit.com/jashkenas/backbone/0.9.2/index.html).
 - [jQuery 1.7.2](http://api.jquery.com/category/version/1.7/)
 - [underscore.js 1.4.4](https://cdn.rawgit.com/jashkenas/underscore/1.4.4/index.html)

Source code is located at `lib/assets/javascripts`, dependencies at `vendor/assets/javascripts`.

See [doc/frontend/README.md](doc/frontend/README.md) for more in-depth documentation.

We apply [semistandard](https://github.com/Flet/semistandard) for syntax consistency of all new code at least, it's checked as part of test run. It's recommended to use [a linter in your IDE of choice](https://github.com/Flet/semistandard#editor-plugins).

Until our guidelines are publically available follow the existing file/directory and style structure.

### Update CartoDB.js

Follow these steps to update to get latest changes:

- go to `lib/assets/javascripts/cdb/`
- `git checkout develop && git pull`
- go back to root and run `grunt cdb`
- commit both the new revision of the submodule and the generated file `vendor/assets/javascripts/cartodb.uncompressed.js`

### Writing & running tests

Tests reside in the `lib/assets/test` directory. We use
 - [Jasmine 2.1](jasmine.github.io/2.1/introduction.html) as test framework
 - [SinonJS 1.3.4](sinonjs.org) for test spies/stubs/mocks when Jasmine spies isn't good enough

When adding new files make sure they exist in an appropriate file located in `lib/build/js_files` (will depends
if you're writing tests for current code or the newer browserify modules).

Until our guidelines are publically available follow the existing file/directory and style structure.

All tests can be run by:
```bash
grunt jasmine

```
…or if you want to run tests in browser open http://localhost:8089/ after running `grunt dev`.

If you only want to run a subset of tests the easiest and fastest way is to use [focused tests](jasmine.github.io/2.1/focused_specs.html), but you can also append  `?spec=str-matching-a-describe` to test URL, or use [--filter flag](https://github.com/gruntjs/grunt-contrib-jasmine#filtering-specs) if running tests in a terminal.

## Grunt

We use [Grunt](http://gruntjs.com/) to automate build tasks related to both CSS and JS.

We use v0.10.x of [node](http://nodejs.org/) (we recommend to use [NVM](https://github.com/creationix/nvm)).

Install dependencies using a normal npm install as such:
```bash
npm install
npm install -g grunt-cli
```

Run `grunt availabletasks` to see available tasks.

First time starting to work you need to run `grunt`, to build all static assets (will be written to `public/assets/:version`).

After that, for typical frontend work, it's recommended to run once:
```bash
grunt
```
This will generate all necessary frontend assets, and then:

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

Before opening a pull request (or submitting a contribution) you will need to sign a Contributor License Agreement (CLA) before making a submission, [learn more here](https://carto.com/contributing).

After that, there are several rules you should follow when a new pull request is created:

- Title has to be descriptive. If you are fixing a bug don't use the ticket title or number.
- Explain what you have achieved in the description and choose a reviewer (it has to be a CartoDB team member) of your code. If you have doubts, just ask for one.
- If you change something related with the UI of the application:
  - Add an image or an animation ([LiceCap](https://github.com/lepht/licecap) is your friend) about the feature you have just implemented. Or show the change against what it is already done.
  - Change UI assets version, present in [package.json](package.json) file. Minor if it is a bugfixing or a small feature, major when it is a big change.
- Our linter machine, [Hound](https://houndci.com/), should not trigger any warnings about your changes.
- All tests should pass, both for JS and Ruby.
