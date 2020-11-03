# CARTO Frontend documentation

1. [Running the project](#running-the-project)
2. [Tasks](#tasks)
3. [Pull Request rules](#pull-request-rules)
4. [JS Styleguide](#js-styleguide)
4. [CSS Styleguide](#css-styleguide)
4. [Testing](#testing)
4. [Static pages](#static-pages)

## Running the project

We use [Webpack](https://webpack.js.org/) to automate build tasks related to both CSS and JS and [NodeJS](http://nodejs.org/) v6.9.2 (we recommend to use [NVM](https://github.com/creationix/nvm)).

Install dependencies using a normal npm install as such:
```bash
npm install
```

Then you can run the project with:

```bash
npm start
```

That enables CSS and JS watchers for rebuilding bundles automatically upon changes.

**Note!** Make sure `config/app_config.yml` doesn't contain the `app_assets` configuration, i.e.:

```ruby
# Make sure the following lines are removed, or commented like this:
# app_assets: 
#   asset_host: '//cartodb-libs.global.ssl.fastly.net/cartodbui'
```

_Don't forget to restart Rails after you have modified `config/app_config.yml`._


## Tasks

This is a list of available tasks to run:

| Task                           | Description
| ---------                      | ---
| `npm start`                    | Compiles `carto-node`, the static pages and watches Builder and Dashboard
| `npm run dev`                  | Runs webpack for Builder and Dashboard
| `npm run dev:static`           | Runs webpack for static pages
| `npm run dev:editor`           | Runs Editor for development
| `npm run dev:do-catalog`       | Runs Data Observatory catalog for development
| `npm run build`                | Create production builds for Builder and Dashboard
| `npm run build:static`         | Create production builds for static pages
| `npm run build:do-catalog`     | Create production builds for Data Observatory catalog
| `npm run carto-node`           | Create production builds for `carto-node`
| `npm run test`                 | Run all test suites
| `npm run test:builder`         | Run and watches builder test suites
| `npm run test:dashboard`       | Run and watches dashboard test suites
| `npm run test:editor`          | Run and watches editor test suites
| `npm run lint`                 | Runs the Javascript linter
| `npm run lint:fix`             | Runs the Javascript linter with the `--fix` flag
| `npm run lint:css`             | Runs the CSS linter
| `npm run bump`                 | Creates a patch version
| `npm run bump:major`           | Creates a major version
| `npm run bump:minor`           | Creates a minor version
| `npm run update-internal-deps` | Update the `package-lock` file
| `npm run ci`                   | Runs the CSS lint and tests

## Pull Request rules

There are several rules you should follow when creating a new pull request:

- Title has to be descriptive. If you are fixing a bug don't use the ticket title or number.
- Explain what you have achieved in the description. If you change something related with the UI of the application add an image or an animation ([LiceCap](https://www.cockos.com/licecap/) is awesome) about the feature you have just implemented. Or show the change against what it is already done.
- Add acceptance instructions, they're really useful for the person who tests it.
- Update `NEWS.md` file with a description about the task, and the issue number.
- CSS and JS linters must pass.
- Every new feature (as well as bug fixes) must come with a test case.
- All tests must pass (see Testing).
- You can see an example of a pull request [here](https://github.com/CartoDB/cartodb/pull/12186).

## JS Styleguide

CARTO is built on top of [CARTO.js](https://github.com/CartoDB/carto.js), which in turns depends on some common libraries, in particular worth mentioning:

 - [BackboneJS 1.2.3](https://cdn.rawgit.com/jashkenas/backbone/1.2.3/index.html).
 - [jQuery 2.1.4](https://api.jquery.com/category/version/1.12-2.2/)
 - [Underscore.js 1.8.3](https://cdn.rawgit.com/jashkenas/underscore/1.8.3/index.html)

Source code is located at `lib/assets/javascripts`, dependencies at `vendor/assets/javascripts`.

We use [semistandard](https://github.com/Flet/semistandard) style guide for syntax consistency, it's checked as part of test run.

It's recommended to use it in your IDE, you can either use a [Semistandard](https://github.com/Flet/semistandard#editor-plugins) plugin or a [ESLint](https://eslint.org/docs/user-guide/integrations#editors) plugin.

### General rules

We use dangling underscores to mark a method as "private", so we know it's only used there. For example `_showTooltip`.

### Backbone events

To keep the code organised we initialise all events in the `_initBinds` function, which is usually called in the `constructor`.

When using `on` or `bind` methods, we have to use `add_related_model` so when the view is removed, the binding is removed too. We won't need to do it if we're using `listenTo` or the model is `this.model`.

```js
// Example with listenTo
_initBinds: function () {
  this.listenTo(this.model, 'change:show', this._onShowChange);
  this.listenTo(this.model, 'destroy', this._onDestroy);
},

// Example with on and add_related_model
_initBinds: function () {
  this._stateModel.on('change:status', this.render, this);
  this.add_related_model(this._stateModel);
},
```

If you want to create a custom event, remember to create it in `camelCase` and using the action in past simple, example:

```js
this.model.trigger('sendMessage', 'Hello there!');
this.listenTo(this.model, 'sendMessage', message => console.log(message));
```

### Backbone views
The render method should be the first in the view after the initialize.

The test should always have the `toHaveNoLeaks` test.

You can add a label to help you relate where the view belongs in the code. Use the attribute `module` in any view and you'll see a data attribute in the HTML element when in development node. [more info](https://github.com/CartoDB/cartodb/pull/12341)

If we have to initialise multiple views inside another view, we use the `_initViews` function as same as we do with events, to keep the code organised.

```js
_initViews: function () {
  // Create view
  this._firstView = new FirstView({
    model: this.model,
  });
  // Render it
  this.$('.js-first').append(this._firstView.render().el);
  // Add as subview to the current view
  this.addView(this._firstView);

  // ... more views here
},
```

## CSS Styleguide

We use [SASS](http://sass-lang.com/), with [.scss](http://www.thesassway.com/editorial/sass-vs-scss-which-syntax-is-better) format, which are located at ```assets/stylesheets```. [Webpack](https://webpack.js.org/) is used to compile the files into ```.css``` files.

Also CARTO makes use of a linter machine for checking possible errors in those stylesheets. Rules are specified in the [scss-style.yml](.stylelintrc) file.

We use Stylelint with the [standard config](https://github.com/stylelint/stylelint-config-standard) and the [property sort ordering](https://github.com/cahamilton/stylelint-config-property-sort-order-smacss) based on the SMACSS methodology.

### General rules
- All new elements added in this CartoAssets repository should have included a CDB- namespace.
- Don't create default styles for common elements (e.g. `input { padding: 10px 0 }`). It will make more difficult edit styles for the future custom elements and the !important use will grow.
- Avoid creating new classes with only one attribute (e.g. `.marginRight { margin-right: 10px }`). It is impossible to manage the amount of cases we would like to cover.

### Components

The component's name must be written in camel case:

```css
.MyComponent {}
```

### Component modifiers

A component modifier is a class that modifies the presentation of the base component in some form.

- Modifier names must be written in “camelCase” and be separated from the component name by two hyphens.
- The class should be included in the HTML in addition to the base component class.

```css
.Button {}
.Button--small {}
```

### Component descendants
A component descendent is a class that is attached to a descendent node of a component. It's responsible for applying presentation directly to the descendent on behalf of a particular component. Descendent names must be written in camel case.

```css
.Card {}
.Card-header {}
.Card-footer {}
.Card-fullWidth {}
```

### Component states

Use `is-stateName` to reflect changes to a component's state, the state name must be camel case.

Never style these classes directly, they should always be used as an adjoining class, this means that the same state names can be used in multiple contexts, but every component must define its own styles for the state (as they are scoped to the component).

```css
.Dropdown {}
.Dropdown.is-open {}
.Dropdown.is-disabled {}
```

### Component javascript classes

JavaScript-specific classes reduce the risk that changing the structure or theme of components will inadvertently affect any required JavaScript behaviour and complex functionality. It is not necessary to use them in every case, just think of them as a tool in your utility belt. If you are creating a class, which you dont intend to use for styling, but instead only as a selector in JavaScript, you should probably be adding the `js-` prefix. In practice this looks like this:

```html
<button class="Button Button--primary js-delete">Delete</button>
```

JavaScript-specific classes should not, under any circumstances, be styled.

## Testing
We use [Jasmine 2.5.2](https://jasmine.github.io/) as test framework.

You can find the spec files in:

```
lib/assets/test/spec/(dashboard|builder|carto-node|deep-insights)
```

To start specs development type the next command:

```bash
# Builder specs
npm run test:builder

# Dashboard specs
npm run test:dashboard
```

You can optionally provide an argument to grunt to filter what specs will be generated, like this:

```bash
npm run test:builder -- --match=dropdown
```

After building the whole suite for the first time, a web server will be started on port 8088 and the spec runner webpage will show up. If you need to use a different port, change the port & URL values on the [connect task](lib/build/tasks/connect.js)

The process will watch changes in the codebase and will regenerate the specs as needed. Just refresh the Jasmine page to pass the tests again.

If you only want to run a subset of tests the easiest and fastest way is to use [focused specs](jasmine.github.io/2.1/focused_specs.html), but you can also append  `?spec=str-matching-a-describe` to test URL, or use [--filter flag](https://github.com/gruntjs/grunt-contrib-jasmine#filtering-specs) if running tests in a terminal.

## Static pages

There are some views that can be served from a static file in `public/static/` directory and must be built beforehand. For that purpose run the following command:

```bash
npm run build:static
```

# Carto v3

- [Backbone with organizations](editor/js/backbone-with-organizations.md)
- [Global objects](editor/js/global-objects.md)
- [Conventions](editor/js/conventions.md)
- [URLs](editor/urls.md)

## Update CartoDB.js v3

Follow these steps to update to get latest changes:

- go to `lib/assets/javascripts/cdb/`
- `git checkout v3 && git pull`
- go back to root and run `grunt cdb`
- commit both the new revision of the submodule and the generated file `vendor/assets/javascripts/cartodb.uncompressed.js`

## Old Editor specs

In order to develop tests for the codebase outside Builder (that is, old Editor and dashboard pages) we advise to run:

```bash
npm run test:editor
```

After the building process finish, a webpage will show up with a link to the Jasmine page with all the specs. The URL of this page is `http://localhost:8089/_SpecRunner.html`

Then, the process will watch changes in the codebase and will regenerate the specs as needed. Just refresh the Jasmine page to pass the tests again.

**Run specs and regular codebase simultaneously**

If you want to run simultaneously the application and the specs generation follow these steps:

1. Open a terminal with Node v6.9.2 (use nvm) and run `grunt editor`. This will build the application assets and will watch for changes.

2. Open a second terminal and run `grunt affected_editor_specs`.

3. That's it. When you change any Builder Javascript file `grunt editor` will build the application bundle and `grunt affected_editor_specs` will build the specs.
