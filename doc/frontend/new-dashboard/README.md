# New Dashboard documentation

## Getting Started
New Dashboard was born as a way to redesign the current dashboard, adapting it to the new times and improving some of the UX patterns there.

We chose Vue for our New Dashboard project because we are using Vue for the new CARTO frontend's projects. That way we can benefit from all the patterns and behaviours implemented in one project or another.

## How to run it
Following [`Running the project` steps in CARTO Frontend's documentation](https://github.com/CartoDB/cartodb/tree/master/doc/frontend#running-the-project) is the way to run New Dashboard.

Once Ruby on Rails is listening on the desired port and Webpack has finished compiling assets, everything should be ready to launch and access the dashboard in localhost:3000.

However, as long as New Dashboard is under a Feature Flag, there are some additional steps to perform before being able to see New Dashboard as the main UI.

### Adding and Enabling `new-dashboard-feature` feature flag
There are two steps to be performed to enable the feature flag to a given user:

- Adding the feature flag
	```bash
	$ bundle exec rake cartodb:features:add_feature_flag["new-dashboard-feature"]
	```

- Enabling it to a specific user
	```bash
	$ bundle exec rake cartodb:features:enable_feature_for_user["new-dashboard-feature","your_username"]
	```


## Command Explanation
We can find some commands in [`package.json`](https://github.com/CartoDB/cartodb/blob/master/package.json) to launch tasks related to new dashboard.

- `npm run start`
	This command will compile all assets needed to launch cartodb with Webpack.

- `npm run test:new_dashboard`
	This command will run all new dashboard tests with Jest. You can add any Jest's CLI option to the command by appending `--` and the desired option, i.e. `-- --watch`. Please see all CLI options [here](https://jestjs.io/docs/en/cli#options)


## Folder Structure
Root folder of new dashboard is `lib/assets/javascripts/new-dashboard`. You will find several folders within that one that define different aspects of our application.

- **assets**\
	This folder contains icons or images referenced within the application.

- **components**\
	Standalone components that can be composed or used within other components or pages.

- **core**\
	Set of common domain login separated from components. An example of this functions would be visualization functions to generate the proper visualizations' URL link.

- **directives**\
	Common application directives for DOM behaviour like closing dropdowns when clicking outside.

- **i18n**\
	Internacionalization configuration for `vue-i18n` and translation strings.

- **pages**\
	Page components used in Vue router to be rendered.

- **plugins**\
	Custom Vue plugins. There is only one right now to inject `$cartoModels` in every component to be able to use initialized UserModel and ConfigModel wherever we need them.

- **router**\
	Router configuration for pages within the Dashboard. It includes navigation hooks for loading data beforehand.

- **store**\
	State management configuration and store for the application which holds all the visualizations, user data, application configuration, etc...

- **styles**\
	Global styles for the application. Here we put common or styles that don't belong to any specific components, such as grid styles, button styles, and so on and so forth.

- **utils**\
	Set of functions to be used application-wide that perform a specific action like counting characters in an array or things like that.

## Bundles
There are several bundles within the application that serve different purposes.

- **Main Bundle**
	This bundle contains the whole application that is served in Ruby on Rails when accessing Dashboard. This bundle uses i18n, router, store, and plugins.

The two bundles below are reduced bundles that are included within private pages to be able to show [Header](https://github.com/CartoDB/cartodb/issues/14312) and [Footer](https://github.com/CartoDB/cartodb/issues/14342) without copying or adapting the code to Ruby on Rails' templates.

- **Header Bundle**.
	This bundle renders `<NavigationBar />` with the component receiving props from window variables like `user_data` or `organization_notifications`.

	[Header Bundle folder](https://github.com/CartoDB/cartodb/tree/master/lib/assets/javascripts/new-dashboard/bundles/header)

	- **Why we can't use $store within `<NavigationBar />`**\
	We have a strong limitation with Vuex in this bundle because we don't want to include it to make the bundle as smaller as possible. So, we rely on component parameters to inject all the needed properties.

- **Footer Bundle**
	This bundle renders `<Footer />` receiving `user` prop from `window.user_data`.

	[Footer Bundle folder](https://github.com/CartoDB/cartodb/tree/master/lib/assets/javascripts/new-dashboard/bundles/footer)

	- **Why we can't use $store within `<Footer />`**\
	We have a strong limitation with Vuex in this bundle because we don't want to include it to make the bundle as smaller as possible. So, we rely on component parameters to inject all the needed properties.

## Store
The store holds all the data which is needed at the current page to be rendered properly, in addition to configuration data and user data.

There are several submodules attached to the main store that allow us to split and separate data domains. These submodules are: config, datasets, maps, notifications, recent content, search, and user.

The way we handle actions and mutations is pretty straightforward.

We do not manipulate data coming from API outside of the store, and whenever we need to retrieve visualizations or any other kind of data needed to render a page we do it through the store.

The flow would be like this:
Let's say that we need visualizations to be rendered within a random component.

The thing we would do is to dispatch an action in the component to make a request to the API from within the store.
```js
mounted () {
	this.$store.dispatch('maps/fetch');
}
```

The dispatched action will request the visualizations to the API, and then will commit a mutation to set the response data to the state itself.

To use the data in page's component, we will create a computed variable with the state property that will be reevaluated whenever visualizations are available.

```js
computed: {
	maps () {
		return this.$store.state.maps.list;
	}
}
```

## Components
Components are one of the most important things within Vue applications. They are what allow us to build the application itself by using and composing them on one another.

We split components into two types: page components and regular components.

Page components are the ones that vue-router render when matching a predefined route. The regular ones are those which are within pages and build what we consider the whole page.

Currently, we are using `.vue` files which have a template, the style definition and the component declaration in the same file.

The template is a plain HTML string in which you can use the handy Vue modifiers like v-for, v-if, etc...

For our components' style definition, we use SCSS and it is scoped, that means that there wouldn't be any collisions amongst CSS classes with the same name.

## Backbone Connection
There is a special thing in the new dashboard related to modals. As we didn't want to rewrite or redesign the existing Dashboard/Builder modals, we thought of using the same ones that we had. Those ones were written using Backbone.

So, we thought, why don't we render those modals within Vue components and use them as if they were Vue components? And that's what we did.

[Here](https://github.com/CartoDB/cartodb/tree/master/lib/assets/javascripts/new-dashboard/components/Backbone/Dialogs) you can find all the components mirroring Builder modals.

The key here is that we get the reference to a HTML node within the template and we inject it to `el` property in the Backbone component. The `el` property makes Backbone render the dialog within the element in the property.

To keep data synchronized between Backbone and our Vuex store, we listen to `change` event in the desired model and whenever that model updates, we react in consequence updating our application state.
