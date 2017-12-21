# encoding: utf-8

require 'active_record'

module Carto
  class UsersGroup < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    belongs_to :group, class_name: Carto::Group

  end
end
