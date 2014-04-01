
# upgrading to new assets pipeline

We have removed the rails assets pipeline to a custom one in order to take control and save
development and deployement time.

There are a few things that change related to deployement and development, here are described the
different usecases.

## development

If you are developing cartodb frontend you need to follow the steps in README file, every time you
change javascript or css you need to compile it.

If you are developing something not related to frontend you don't need to compile anything, just:

```
curl http://libs.cartocdn.com/cartodbui/manifest.yml > public/assets
```

and change in ``confg/app_config.yml``

```
  app_assets:
    asset_host: 'http://libs.cartocdn.com/cartodbui'
```

and reload rails server

## deployement

### in the cloud
assets dont' need to be precompiled by rails, it's done by release task:

```
grunt --environment production release
```

This should be done before the rails deploy
the manifest is located at http://libs.cartocdn.com/cartodbui/manifest.yml

### custom installs
you need to follow steps in README.md and use the right ``asset_host`` variable in order to point to
local assets
