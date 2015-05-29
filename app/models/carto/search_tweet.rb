# encoding: UTF-8

require 'active_record'

module Carto
  class SearchTweet < ActiveRecord::Base

    belongs_to :user, inverse_of: :users
    belongs_to :user_table, class_name: 'Carto::UserTable'

  end
end