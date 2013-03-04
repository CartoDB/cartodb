# encoding: utf-8
require 'json'
require 'redis'
require_relative '../data-repository/filesystem/local'

module CartoDB
  module Relocator
    module Redis
      class Loader
        include DataRepository
      end Loader
    end # Redis
  end # Relocator
end # CartoDB

