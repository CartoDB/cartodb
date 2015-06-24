The development tracker for cartodb is on github:
http://github.com/cartodb/cartodb/

Bug fixes are best reported as pull requests over there.
Features are best discussed on the mailing list:
https://groups.google.com/d/forum/cartodb

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

## JS

CartoDB is built on top of [CartoDB.js](https://github.com/CartoDB/cartodb.js),
which in turns depends on some common libraries, in particular worth mentioning:

 - [BackboneJS 0.9.2](https://cdn.rawgit.com/jashkenas/backbone/0.9.2/index.html).
 - [jQuery 1.7.2](http://api.jquery.com/category/version/1.7/)
 - [underscore.js 1.4.4](https://cdn.rawgit.com/jashkenas/underscore/1.4.4/index.html)

Source code is located at `lib/assets/javascripts`, dependencies at `vendor/assets/javascripts`.

See [doc/frontend.md](doc/frontend.md) for more in-depth documentation.

Until our guidelines are publically available follow the existing file/directory and style structure.

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

# or if you want to run tests in browser it's preferrable to use:
grunt jasmine-server
```

If you only want to run a subset of tests the easiest and fastest way is to use [focused tests](jasmine.github.io/2.1/focused_specs.html), but you can also append  `?spec=str-matching-a-describe` to test URL, or use [--filter flag](https://github.com/gruntjs/grunt-contrib-jasmine#filtering-specs) if running tests in a terminal.

## CSS

We use [SASS](http://sass-lang.com/),
 with [`.scss`](http://www.thesassway.com/editorial/sass-vs-scss-which-syntax-is-better) format.

Source files are located at `app/assets/stylesheets`. We used to use Rails sprockets pipeline,
 but nowadays migrated to [Grunt](#grunt) (see that section for details).

See [doc/frontend.md](doc/frontend.md) for more in-depth documentation.

Until our guidelines are publicly available follow the existing file/directory and style structure.

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

and then

```bash
grunt dev
```
This will watch CSS and JS files and rebuild bundles automatically upon changes.

**Note!** Make sure `config/app_config.yml` don't contain the `app_assets` configuration, i.e.:

```ruby
# Make sure the following lines are removed, or commented like this:
#app_assets: 
#  asset_host: '//cartodb-libs.global.ssl.fastly.net/cartodbui'
```

_Don't forget to restart Rails after you have modified `config/app_config.yml`._
