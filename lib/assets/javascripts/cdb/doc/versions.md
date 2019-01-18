# Versions

Be mindful of the CARTO.js version that you are using for development. For any live code, it is recommended to link directly to the tested CARTO.js version from your development environment. You can check the version of CARTO.js as follows:

## cartodb.VERSION

Returns the version of the library. It should be something such as, `3.0.1`.

## Persistent Version Hosting

CARTO is committed to making sure your website works as intended, no matter what changes in the future. As time progresses, it is expected that we will find more efficient, and useful, features to add to the library. Since we never want to break things that you have already developed, we provide versioned CARTO.js libraries. Regardless of the version, the library functionality will never unexpectedly change on you.

**Note:** It is recommended to always develop against the most recent version of CARTO.js:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

Anytime you wish to push a stable version of your site to the web, you can find the version of CARTO.js that you are using located in the first line of the library, or by running the following in your code:

```javascript
alert(cartodb.VERSION)
```

Once you know which version of CARTO.js you are using, you can point your site to that release. For example, if the current version of CARTO.js is 3.15.8, the URL would be:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15.8/cartodb.js"></script>
```

You can do the same for the CSS documents we provide:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15.8/themes/css/cartodb.css" />
```