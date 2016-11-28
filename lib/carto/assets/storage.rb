# encoding: utf-8

require 'singleton'

require_relative './s3'
require_relative './local'

class Carto::Storage
  include singleton

  def initialize
    @storage = S3.instance_if_enabled || Local.instance_if_enabled
  end
end
