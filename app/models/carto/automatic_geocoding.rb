# encoding: utf-8

require 'active_record'

module Carto
  class AutomaticGeocoding < ActiveRecord::Base
    has_many :geocodings, -> { order(:created_at) }
    belongs_to :table, class_name: Carto::UserTable, inverse_of: :automatic_geocodings, foreign_key: :id
    belongs_to :user, class_name: Carto::User, inverse_of: :automatic_geocodings
  end
end
