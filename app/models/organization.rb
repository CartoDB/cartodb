# encoding: utf-8
require_relative './organization/organization_decorator'

class Organization < Sequel::Model

  include CartoDB::OrganizationDecorator

  Organization.raise_on_save_failure = true

  # @param id String (uuid)
  # @param seats String
  # @param quota_in_bytes Integer
  # @param created_at Timestamp
  # @param updated_at Timestamp
  # @param name String
  # @param avatar_url String

  one_to_many :users
  many_to_one :owner, class_name: 'User', key: 'owner_id'
  plugin :validation_helpers

  ALLOWED_API_ATTRIBUTES = [
    :name, :seats, :quota_in_bytes, :owner_id
  ]

  def validate
    super
    validates_presence [:name, :quota_in_bytes, :seats]
    validates_unique   :name
    validates_format   /^[a-z0-9\-]+$/, :name, message: 'must only contain lowercase letters, numbers & hyphens'
    errors.add(:name, 'cannot exist as user') if name_exists_in_users?
  end

  # Just to make code more uniform with user.database_schema
  def database_schema
    self.name
  end

  def before_save
    super
    self.updated_at = Time.now
    raise errors unless valid?
  end

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum.to_i
  end

  def assigned_quota
    users_dataset.sum(:quota_in_bytes).to_i
  end

  def unassigned_quota
    quota_in_bytes - assigned_quota
  end

  def to_poro(filtered_user = nil)
    filtered_user ||= self.owner
    {
      :id             => self.id,
      :seats          => self.seats,
      :quota_in_bytes => self.quota_in_bytes,
      :created_at     => self.created_at,
      :updated_at     => self.updated_at,
      :name           => self.name,
      :owner          => {
        :id           => self.owner ? self.owner.id : nil,
        :username     => self.owner ? self.owner.username : nil,
        :avatar_url   => self.owner ? self.owner.avatar_url : nil
      },
      :users          => self.users.reject { |item| filtered_user && item.id == filtered_user.id }
        .map { |u|
        {
          :id       => u.id,
          :username => u.username,
          :avatar_url => u.avatar_url
        }
      }
    }
  end

  private

  def name_exists_in_users?
    !User.where(username: self.name).first.nil?
  end

end

