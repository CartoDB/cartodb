CARTO Gears API
===============

**DISCLAIMER: CARTO Gears API is still in development, it won't be considered stable until first major 1 version**

# An API for building CARTO Gears

CARTO Gear: Rails engine built on top of CARTO, using CARTO Gears API.

This is meant to be a documented way to add new features to CARTO, in a non-intrusive manner,
taking advantage of a domain API maintained by CARTO team. Our goal with this API and conventions is making
CARTO easily extensible.

References:

- [Component-based Rails Applications, Stephan Hagemann](https://leanpub.com/cbra).
- [Rails 4 Engines, Brian Leonard](http://tech.taskrabbit.com/blog/2014/02/11/rails-4-engines/).

# HOWTO

## Private vs public gears

CARTO currently supports two directories for Gears:

`/gears`

Public engines. For example, for new features developed with a component-based approach.
It's part of the main repo and gears inside it will be automatically added to `Gemfile` and `Gemfile.lock`.

`/private_gears`

Private engines. For example, for in-house developments that can't be shipped with the Open Source version.
It's skipped at `.gitignore`, and it's dynamically loaded, so it won't appear in `Gemfile` or `Gemfile.lock`.
You can have the code wherever you want, and add symbolic links there.

### Private gears limitations

Due to the custom handling of this in order to avoid polluting Gemfile and Gemfile.lock files, private gears
have several limitations:

- If you specify a runtime dependency of a gem already existing at Gemfile, it must have the exact version.
- Although the private gem itself doesn't appear in `Gemfile` or `Gemfile.lock`, dependencies do, because they need to
be installed.

### Generating a clean Gemfile.lock

As said, `Gemfile.lock` won't mention private gears, but it contains private gears dependencies.
In order to generate a clean `Gemfile.lock`, you should:

1. `mv private_gears private_gears.bak`
2. `bundle update`
3. `git commit Gemfile.lock -m "Clean Gemfile.lock" && git push`
4. `mv private_gears.bak private_gears`

## Create a Rails engine

Assuming that you pick `/gears`, create a Rails engine by

```ruby
bundle exec rails plugin new gears/my_component --full --mountable
```

It will be mounted at root (`/`) and automatically loaded.

Automatic reload for development is supported right out of the box.

You must use only classes under `CartoGearsApi` namespace. _It's currently under `/gears/carto_gears_api/lib`,
but it will be documented before first public release._

## Tests

CartoDB runs the tests with `bundle exec rspec` at engine directory. If you want to use this, you should create
your tests with rspec.

In order to enable rspec:

1. `rspec --init`
2. Copy the contents of `test_helper.rb` into `spec_helper`.
3. Run `rspec` and fix path errors that you might get.

# Documentation

## `CartoGearsAPI::` (Ruby API)
Generate the documentation with `yard`.

## Extension points

### Adding links to profile page

Example:

```ruby
CartoGearsApi::Pages::Subheader.instance.links_generators << lambda do |context|
  user = CartoGearsApi::UsersService.new.logged_user(context.request)
  if user.has_feature_flag?('carto_experimental_gear')
    include CartoGearsApi::UrlHelper

    [
        CartoGearsApi::Pages::SubheaderLink.with(
          path: carto_gear_path(:my_gear, context, 'something'),
          text: 'The Text',
          controller: 'my_gear/something')
    ]
  end
end
```