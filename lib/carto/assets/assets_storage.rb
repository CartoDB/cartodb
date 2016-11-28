# encoding: utf-8

require 'singleton'

class Carto::Storage
  include singleton

  def initialize
    @storage = s3 ? s3 : local
  end
end
