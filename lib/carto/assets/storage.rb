# encoding: utf-8

require 'singleton'

module Carto
  class Storage
    include singleton

    def initialize
      S3.new_if_available || Local.new
    end
  end
end
