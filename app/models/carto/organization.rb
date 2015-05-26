require 'active_record'

module Carto
  class Organization < ActiveRecord::Base

    has_many :users, inverse_of: :organization
    belongs_to :owner, class_name: Carto::User

  end

end
