# coding: UTF-8

class FeatureFlagsUser < Sequel::Model
  include CartoDB::MiniSequel

  many_to_one :feature_flag
  many_to_one :user

end 

