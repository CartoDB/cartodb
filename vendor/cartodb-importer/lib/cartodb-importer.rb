# coding: UTF-8

require 'rubygems'
require 'bundler/setup'
require 'pg'
require 'sequel'
require 'tempfile'
require 'ruby-debug'
require 'csv'
require 'ostruct'
require "roo"
require "spreadsheet"
require "google_spreadsheet"
require "zip/zip"
require "builder"

require 'cartodb-importer/importer'
require 'core_ext/string'
require 'core_ext/hash'
require 'core_ext/blank'