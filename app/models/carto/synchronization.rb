require 'active_record'

class Carto::Synchronization < ActiveRecord::Base
  belongs_to :user

  def authorize?(user)
    user.id == user_id && !!user.sync_tables_enabled
  end

  def to_json(*args)
    attributes.to_json(*args)
  end

  def to_hash
    attributes.to_hash
  end

end
