<link href="https://raw.github.com/clownfart/Markdown-CSS/master/markdown.css" rel="stylesheet"></link>

# cartodb js framework quick start

This is a little doc with the basis of cartodb js framework (TM), in other words, all you need to know to start workig with it wihout doint it too much wrong.

## general info
 - The framework(TM) is built on top of Backbone.js (so you can use jQuery and underscore everywhere).
 - we use jasmine for testing
 - cdb is the namespace, so all the components should be inside it, i.e cbd.geo.Map. (look into cartodb.js)
 - code style guide: https://github.com/Vizzuality/cartodb/wiki/Javascript-style-guide

## folders (will be changed soon)
 - cartodb.js: this file contains the scopes for all the app, should be included first
 - core
 - geo
 - lib
 - demos: place where to put demos for a component. It is recomended to test the components isolated
 - test

## core

this contains all the base classes, used in all the project:

 - config: all the app config goes here. Accesible by cdb.config
 - logging: never ever use console.log, use cbd.log.info, cdb.log.error and cdb.debug. error call will generate an error  You can check errors with cbd.errors singleton (it is a backbone.Collection)
 - view: DO NOT USE Backbone.View, use cbd.core.View instead. It tracks zombie views and make removing views safe. More later
 - templates


## general guidelines for views

 - never ever change a view directly. For example a button that changes the state should change the model and the view should change when the models triggers the change event.

 - call clean when your view will not be used anymore

 - link model events in this way, even if you have binded the method. Notice the 3rd parameter (this)

        this.model.bind('change', this.callback, this);

    when you have to unlink the view from the model you can do:

        this.model.unbind(null, null, this);

 - if your view has model and listen events from it, add to realted models (will be free when you call clean):

        // inside the view
        this.add_related_model(this.whatevermodel);

## how to use view

## info

 - read backbone annotated source: http://backbonejs.org/docs/backbone.html







