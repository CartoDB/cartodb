# encoding: utf-8

require 'singleton'
require 'carto/storage/s3'
require 'carto/storage/local'

module Carto
  class Storage
    include Singleton

    def initialize
      S3.new_if_available || Local.new
    end
  end
end
