## FAQs

CARTO.js 4.0 introduces new concepts that in some cases, change the behavior of old components. This section clarifies those changes and describe new functionality.

### Do I need an API Key?

Yes. See the [full reference API](/documentation/carto-js/reference/#authenticatio)for details.

### How do I request an API Key?

From your CARTO dashboard, click _Your API keys_ from the avatar drop-down menu to view your uniquely generated API Key.


<!-- Writer Note_csobier: This shared content also appears in the Quickstart Guide and from the Reference/Authentication section. USE CONSISTENT DESCRIPTIONS UNTIL SHARED CONTENT IS SUPPORTED--> 

### What are the permissions for an API Key?

You will have full-control permissions for the Beta release, however your datasets must be public for the Beta release.

For the time being, API Keys give your apps full access to CARTO services. We are working on a new Authentication system that will allow you to customize API Key permissions in a more granular and secure way. These changes will not disrupt anything on the CARTO.js side and you will be notified once this new authentication system is implemented.

### How do I pay for my API Keys?

All billing is managed through your CARTO account.

The release of the updated CARTO.js library does not impact your plan in any way. There are no changes in terms of costs or payments of your CARTO use. As noted above, we are already working on a new Authentication system as part of our product roadmap. This new feature will be included as part of a future release and will not incur additional costs for you.

### Can I still use `cartodb.createVis` and `viz.json` URLs?

No, you cannot. While `cartodb.createVis` and `viz.json` URLs were convenient and allowed you to prototype a map using CARTO Editor (the former version of Builder) to create a custom app, the functionality of the library has changed.

In CARTO.js 4.0, we are taking a more programmatic, low-level approach and identifying components that are separate from the front-end tool (CARTO Builder). This will make the API easier to use and more intuitive, giving developers greater flexibility in maintaining their core application. We understand that these old functions are necessary so a future enhancement of the library will include similar functionality.

### Can I still use Named Maps?

No, you cannot.

Named Maps was a powerful and popular feature yet not easy to understand. Named maps were designed as a workaround for some of the limitations of our API Keys. Named maps will be replaced by our new, easier to use, Authentication system.


### What are the main features of this release?

This new library allows you to create custom Location Intelligence applications using Builder capabilities.

Highlights of this release include the ability to:

1. Display data from datasets managed in Builder on a Leaflet map.
2. Manage layers programmatically.
3. Get data from CARTO to create custom UI components using Dataviews.

### What is next?

We want to detect any possible blockers and receive feedback. Depending on the information gathered, we expect that the Final Release could be available in as little 3-4 weeks (early January 2018).


### Is the roadmap public?

No, not yet.

We are still choosing the best tool to show our roadmap. In the meantime you can browse the issues in the CARTO.js repo to see what we are working on.

### Are there any temporary limitations in the Beta release?

Yes, certain functionality is still being developed and are temporarily unavailable (such as Google Maps (GMaps) map integration, Torque maps, legend functionality, Histogram widget totals, Time-Series widgets using numeric columns, and CartoCSS styling). Additionally, since we are still working on the Authentication feature, datasets must be public when testing the Beta library. A future enhancement will include the ability to work with private data.

The Beta release specifically introduces the restructured library and enables you to display data from CARTO over a map. Future updates will include additional UI components as the library continues to expand.