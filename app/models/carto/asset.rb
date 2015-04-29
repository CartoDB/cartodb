# encoding: UTF-8

require 'active_record'

module Carto
  class Asset < ActiveRecord::Base

     belongs_to :user

  end
end
