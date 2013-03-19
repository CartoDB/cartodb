# encoding: utf-8
require 'csv'
require 'tempfile'
require 'ostruct'
require 'open-uri'

Dir[
  File.dirname(__FILE__) + '/cartodb-importer/utils/*.rb',
  File.dirname(__FILE__) + '/cartodb-importer/decompressors/*.rb',
  File.dirname(__FILE__) + '/cartodb-importer/preprocessors/*.rb',
  File.dirname(__FILE__) + '/cartodb-importer/loaders/*.rb'
].each { |file| require file }

require File.dirname(__FILE__) + '/cartodb-importer/importer'

