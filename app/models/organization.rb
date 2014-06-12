# encoding: utf-8

class Organization < Sequel::Model

  Organization.raise_on_save_failure = true

  # @param id String (uuid)
  # @param seats String
  # @param quota_in_bytes Integer
  # @param created_at Timestamp
  # @param updated_at Timestamp
  # @param name String

  one_to_many :users
  plugin :validation_helpers

  def validate
    super
    validates_presence [:name, :quota_in_bytes]
    validates_unique   :name
    validates_format   /^[a-z0-9\-]+$/, :name, message: 'must only contain lowercase letters, numbers & hyphens'
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

  def owner
    @owner ||= User.where(Sequel.&(organization_id: self.id, organization_owner: true)).first
  end

  def to_poro
    {
      :id             => self.id,
      :seats          => self.seats,
      :quota_in_bytes => self.quota_in_bytes,
      :created_at     => self.created_at,
      :updated_at     => self.updated_at,
      :name           => self.name,
      :owner          => {
        :id           => owner.id,
        :username     => owner.username,
        :avatar_url   => owner.avatar_url
      },
      :users          => self.users.select { |item| item.id != self.owner.id }
                                   .map { |u|
        {
          :id       => u.id,
          :username => u.username,
          :avatar_url => u.avatar_url
        }
      }
    }
  end
end
