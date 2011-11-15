# coding: UTF-8

require 'rubygems'
require 'bundler'
Bundler.setup

require 'rgeo'
require 'rgeo/geo_json'
require 'roo'
require 'csv'
require 'tempfile'
require 'ostruct'
require 'cartodb-exporter/exporter'
require 'core_ext/string'
require 'core_ext/hash'
require 'core_ext/blank'