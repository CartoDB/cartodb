require 'active_record'

module Carto

  class User < ActiveRecord::Base
    has_many :visualizations, inverse_of: :user
    belongs_to :organization, inverse_of: :users
  end

end
