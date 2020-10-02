require 'active_record'

class Carto::Synchronization < ActiveRecord::Base

  belongs_to :user, class_name: Carto::User
  belongs_to :visualization, class_name: Carto::Visualization
  belongs_to :log, class_name: Carto::Log

  has_many :external_data_imports, class_name: Carto::ExternalDataImport

  STATE_CREATED = 'created'.freeze
  # Already at resque, waiting for slot
  STATE_QUEUED = 'queued'.freeze
  # Actually syncing
  STATE_SYNCING   = 'syncing'.freeze
  STATE_SUCCESS   = 'success'.freeze
  STATE_FAILURE   = 'failure'.freeze

  def authorize?(user)
    user.id == user_id && (!!user.sync_tables_enabled || from_external_source?)
  end

  def to_json(*args)
    attributes.merge({ from_external_source: from_external_source? }).to_json(*args)
  end

  def to_hash
    attributes.merge({ from_external_source: from_external_source? }).to_hash
  end

  def success?
    state == STATE_SUCCESS
  end

  def from_external_source?
    Carto::ExternalDataImport.where(synchronization_id: id).first != nil
  end

end
