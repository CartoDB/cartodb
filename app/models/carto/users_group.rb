require 'active_record'

module Carto
  class UsersGroup < ActiveRecord::Base
    # autosave must be explicitly disabled due to https://github.com/rails/rails/issues/9336
    # but we probably should not autosave from a ternary table anyway
    belongs_to :user, class_name: Carto::User, autosave: false
    belongs_to :group, class_name: Carto::Group, autosave: false
  end
end
