CARTO Gears API
===============

# An API for building CARTO Gears

CARTO Gear: Rails engine built on top of CARTO, using CARTO Gears API.

This is meant to be a documented way to add new features to CARTO, in a non-intrusive manner,
taking advantage of a domain API maintained by CARTO team. Our goal with this API and conventions is making
CARTO easily extensible.

References:

- [Component-based Rails Applications, Stephan Hagemann](https://leanpub.com/cbra).
- [Rails 4 Engines, Brian Leonard](http://tech.taskrabbit.com/blog/2014/02/11/rails-4-engines/).

# HOWTO

## Pick a directory

CARTO currently supports two directories for Gears:

`/gears`

Directory for public components. For example, if you begin a development of a new feature within CARTO and you want to do it
with a component-based approach, this is a good place. It's part of the main repo and Gears here will be
automatically added to `Gemfile.lock` .

`/private_gears`

Private gears. It's skipped at `.gitignore`, and it's dynamically loaded, so it won't appear in `Gemfile.lock`. You
can add symbolic links there to external repos.

### Private gears limitations

Due to the custom handling of this in order to avoid polluting Gemfile and Gemfile.lock files, private gears
have several limitations:

- If you specify a runtime dependency of a gem already existing at Gemfile, it must have the exact version.
- Although the private gem itself doesn't appear in Gemfile or Gemfile.lock, dependencies do, because they need to be installed.

## Create a Rails engine

Assuming that you pick `/gears`, create a rails engine:

```ruby
bundle exec rails plugin new gears/my_component --full --mountable
```

It will be monted at root (`/`) and automatically loaded.

Automatic reload for development is supported right out of the box.

You must use only classes under `CartoGearsApi` namespace. _It's currently under `/gears/carto_gears_api/lib`,
but it will be documented before first public release._
