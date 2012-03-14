# coding: UTF-8

require 'rubygems'
require 'csv'
require 'tempfile'
require 'ostruct'
require 'open-uri'

# load preprocessors and loaders
Dir[File.dirname(__FILE__) + '/cartodb-importer/lib/*.rb'].each {|file| require file }

# load factories
require File.dirname(__FILE__) + '/cartodb-importer/decompressors/factory'
require File.dirname(__FILE__) + '/cartodb-importer/preprocessors/factory'
require File.dirname(__FILE__) + '/cartodb-importer/loaders/factory'

Dir[File.dirname(__FILE__) + '/cartodb-importer/decompressors/*.rb',
    File.dirname(__FILE__) + '/cartodb-importer/preprocessors/*.rb',
    File.dirname(__FILE__) + '/cartodb-importer/loaders/*.rb'].each {|file| require file }

# main file last
require File.dirname(__FILE__) + '/cartodb-importer/importer'
