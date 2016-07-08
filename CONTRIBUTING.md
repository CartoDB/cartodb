## How to contribute to CartoDB.js

1. [CartoDB.js quick start](#cartodbjs-framework-quick-start)
2. [Being part of CartoDB.js](#being-part-of-cartodbjs)
3. [Filling a ticket](#filling-a-ticket)
4. [Contributing code](#contributing-code)
5. [Completing documentation](#completing-documentation)
6. [Submitting contributions](#submitting-contributions)


### CartoDB.js quick start

This is a little doc with the basis of CartoDB.js framework (TM), in other words, all you need to know to start working with it without doing it wrong.

#### general info
 - The framework(TM) is built on top of Backbone.js (so you can use jQuery and underscore everywhere).
 - we use jasmine for testing (```grunt test```)
 - cdb is the namespace, so all the components should be inside it, i.e cdb.geo.Map. (look into cartodb.js)
 - code style guide: https://github.com/cartodb/cartodb/wiki/Javascript-style-guide

#### folders
 - cartodb.js: this file contains the scopes for all the app, should be included first
 - core
 - geo
 - lib
 - test
 - examples

#### core

This contains all the base classes, used in all the project:

 - config: all the app config goes here. Accessible by cdb.config
 - logging: never ever use console.log, use cdb.log.info, cdb.log.error and cdb.debug. error call will generate an error  You can check errors with cdb.errors singleton (it is a backbone.Collection)
 - view: DO NOT USE Backbone.View, use cdb.core.View instead. It tracks zombie views and make removing views safe.
 - templates


#### general guidelines for views

- never ever change a view directly. For example a button that changes the state should change the model and the view should change when the models triggers the change event.

- call clean when your view will not be used anymore

- link model events in this way, even if you have bound the method. Notice the 3rd parameter (this)

  ·this.model.bind('change', this.callback, this);

- when you have to unlink the view from the model you can do:

  · this.model.unbind(null, null, this);

- if your view has model and listen events from it, add to related models (will be free when you call clean):

  // inside the view
  this.add_related_model(this.whatevermodel);


## Being part of CartoDB.js
If you are reading this file you are already part of CartoDB :). But you can always help the community [contributing in the code](#Contributing-code) or answering questions in any of the channels you can find us, [our google group](https://groups.google.com/forum/#!forum/cartodb) and [stack exchange](http://gis.stackexchange.com/questions/tagged/cartodb).


## Filling a ticket
If you want to open a new issue in our repository, please follow these instructions:

1. Descriptive title.
2. Write a good description, it always helps.
3. Include your browser, OS and CartoDB.js version (it shows up in the browser console).
4. Specify the steps to reproduce the problem.
5. Try to add an example showing the problem (using [JSFiddle](http://jsfiddle.net), [JSBin](http://jsbin.com),...).


## Contributing code
Best part of open source, collaborate in CartoDB.js code!. We like hearing from you, so if you have any bug fixed, or a new feature ready to be merged, those are the steps you should follow:

1. Fork the CartoDB.js repository.
2. Create a new branch in your forked repository.
3. Commit your changes. Add new tests if it is necessary (```grunt test```), remember to follow ["How to build"](https://github.com/CartoDB/cartodb.js/blob/master/README.md#how-to-build) steps.
4. Open a pull request.
5. Any of the CartoDB.js maintainers will take a look.
6. If everything works, it will merged and released \o/.

If you want more detailed information, this [GitHub guide](https://guides.github.com/activities/contributing-to-open-source/) is a must.


## Completing documentation

CartoDB.js documentation is located in ```doc/API.md```. That file is the content that appears in [CartoDB platform documentation](http://docs.carto.com/cartodb-platform/cartodb-js.html).
Just follow the instructions described in [contributing code](#contributing-code) and after accepting your pull request, we will make it appear online :).

## Submitting contributions

You will need to sign a Contributor License Agreement (CLA) before making a submission. [Learn more here](https://carto.com/contributing).
