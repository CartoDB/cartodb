# CARTO.js 4

CARTO.js is a JavaScript library to create custom location intelligence applications that leverage the power of [CARTO](https://carto.com/). It is the library that powers [Builder](https://carto.com/builder/) and it is part of the [Engine](https://carto.com/pricing/engine/) ecosystem.

## Getting Started

The best way to get started is to navigate through the CARTO.js documentation site:

- [Guide](https://carto.com/developers/carto-js/guides/quickstart/) will give you a good overview of the library.
- [API Reference](https://carto.com/developers/carto-js/reference/) will help you use a particular class or method.
- [Examples](https://carto.com/developers/carto-js/examples/) will demo some specific features.
- [Support](https://carto.com/developers/carto-js/support/) might answer some of your questions.

## Versioning

We use [SemVer](http://semver.org/) for versioning.

Please refer to [CHANGELOG.md](CHANGELOG.md) for a list of notables changes for each version of the library.

You can also see the [tags on this repository](https://github.com/CartoDB/carto.js/tags).

## Submitting Contributions

You will need to sign a Contributor License Agreement (CLA) before making a submission. [Learn more here.](https://carto.com/contributions/)

## License

This project is licensed under the BSD 3-clause "New" or "Revised" License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Documentation

### API Reference

Run `npm run docs` to build the API reference documentation from jsdoc annotations.

Once the task is done, you can visit `docs/public/index.html` to check the reference

### General documentation

You can read the general documentation that is published at [https://carto.com/developers/cartojs/](https://carto.com/developers/cartojs/) also in this repo. They are written in Markdown.

Warning: internal links in these documents don't work. They are replaced when the documentation is published in [https://carto.com/](https://carto.com/developers/cartojs/)


#### Guides

The folder `docs/guides` contains general information about the CARTO.js library.

- Quickstart: get started quickly following this tutorial.
- Upgrade considerations: if you have experience with previous versions of CARTO.js, this is the place to learn the differences between the former library and the newest one.
- Glossary: terms that appear throughout the documentation.

#### Examples

In the folder `examples/public` you can find several folders with example for every feature of CARTO.js.

#### Reference topics

The document `docs/reference/topics.md` contains general considerations when working with CARTO.js. It's advisable to read them before diving in the API reference.

#### Support

The folder `docs/support` contains several document with support documentation: support options, FAQs, error messages...

## Development

### Run the tests

```
npm test
```

### Build the library

```
npm run build
```

To watch the files

```
npm run build:watch
```

### Generate the docs

```
npm run docs
```

### Release version

```
npm run bump
```

To publish a release to the `CDN` and `npm`

```
npm run release
```


## Looking for the previous version?
Previous version cartodb.js v3 it's available [here](https://github.com/CartoDB/carto.js/tree/develop)
