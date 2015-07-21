require 'active_record'

class Carto::Synchronization < ActiveRecord::Base
  
  belongs_to :user

  STATE_CREATED   = 'created'
  # Already at resque, waiting for slot
  STATE_QUEUED   = 'queued'
  # Actually syncing
  STATE_SYNCING   = 'syncing'
  STATE_SUCCESS   = 'success'
  STATE_FAILURE   = 'failure'


  def authorize?(user)
    user.id == user_id && !!user.sync_tables_enabled
  end

  def to_json(*args)
    attributes.to_json(*args)
  end

  def to_hash
    attributes.to_hash
  end

  def success?
    state == STATE_SUCCESS
  end

  # TODO: Properly migrate log to AR and remove this
  def log
    CartoDB::Log[self.log_id]
  end

end
