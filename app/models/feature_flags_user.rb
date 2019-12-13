require_relative '../../lib/cartodb/mini_sequel'

class FeatureFlagsUser < Sequel::Model
  include CartoDB::MiniSequel

  many_to_one :feature_flag
  many_to_one :user

end 

