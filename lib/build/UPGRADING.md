
# upgrading to new assets pipeline

We have changed the rails assets pipeline to a custom one in order to take control and save
development and deployement time.

There are a few things that change related to deployment and development, below you can find the
different use cases.

## development

If you are developing cartodb frontend you need to follow the steps in README file, every time you
change javascript or css you need to compile it. You can use watch task:

```
grunt watch:js
```

so every time javascript is changed the files are compiled

**If you are developing something not related to frontend** you don't need to compile anything, change your ``confg/app_config.yml``

```
  app_assets:
    asset_host: '//cartodb-libs.global.ssl.fastly.net/cartodbui'
```

and reload rails server

## deployment

### in the cloud
assets dont' need to be precompiled by rails, it's done by release task:

```
grunt --environment production release
```


### custom installs

just follow steps in README.md and then:

```
grunt release
```

config/enviorment/staging.rb need to remove ``app_assets`` from ``config/app_config.yml`` so assets
are loaded from local

