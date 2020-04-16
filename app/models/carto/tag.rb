require 'active_record'

module Carto
  class Tag < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    belongs_to :user_table, class_name: Carto::UserTable, foreign_key: :table_id, primary_key: :table_id

    validates :name, presence: true
  end
end
