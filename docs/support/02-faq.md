## FAQs

CARTO.js 4.0 introduces new concepts that in some cases, change the behavior of old components. This section clarifies those changes and describe new functionality.

### Do I need an API Key?

Yes. See the [full reference API]({{site.cartojs_docs}}/reference/#authentication) for details.

If you want to learn more about authorization and authentication, read the [fundamentals]({{site.fundamental_docs}}/authorization/) about this topic, or dig into the [Auth API]({{site.authapi_docs}}/) details.

### How do I request an API key?

From your CARTO dashboard, click _Your API keys_ from the avatar drop-down menu to view your uniquely generated API key.

### What are the permissions for an API key?

The permissions you set up when you create the API key. CARTO platform uses an authentication system that allows you to customize API key permissions in a granular and secure way.

### How do I pay for my API Keys?

All billing is managed through your CARTO account.

The release of the updated CARTO.js library does not impact your plan in any way. There are no changes in terms of costs or payments of your CARTO use.

### Can I still use `cartodb.createVis` and `viz.json` URLs?

No, you cannot. While `cartodb.createVis` and `viz.json` URLs were convenient and allowed you to prototype a map using CARTO Editor (the former version of Builder) to create a custom app, the functionality of the library has changed.

In CARTO.js 4.0, we are taking a more programmatic, low-level approach and identifying components that are separate from the front-end tool (CARTO Builder). This will make the API easier to use and more intuitive, giving developers greater flexibility in maintaining their core application.

### Can I still use Named Maps?

No, you cannot.

Named Maps was a powerful and popular feature yet not easy to understand. Named maps were designed as a workaround for some of the limitations of our API keys. Named maps' purpose might be replicated by the new authorization system.


### What are the main features of this release?

This new library allows you to create custom Location Intelligence applications using Builder capabilities.

Highlights of this release include the ability to:

1. Display data from datasets managed in Builder on a Leaflet map.
2. Manage layers programmatically.
3. Get data from CARTO to create custom UI components using Dataviews.

You can learn more about these main features reading the [final release announcement]({{site.cartojs_docs}}/support/release-announcement/).
