# encoding: utf-8

require 'singleton'

require_relative './s3'
require_relative './local'

class Carto::Storage
  include singleton

  def initialize
    @storage = s3 ? s3 : local
  end

  private

  def s3
  end

  def local
  end
end
