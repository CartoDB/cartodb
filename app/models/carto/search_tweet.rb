# encoding: UTF-8

require 'active_record'

module Carto
  class SearchTweet < ActiveRecord::Base

    belongs_to :user, inverse_of: :users
    belongs_to :table, class_name: 'Carto::UserTable'

    # many_to_one :user
    #many_to_one :table, class: :UserTable

  end
end