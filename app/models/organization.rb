class Organization < Sequel::Model

  # @param id String
  # @param seats Integer
  # @param quota_in_bytes Integer
  # @param created_at Time
  # @param updated_at Time
  # @param name String

  one_to_many :users
  plugin :validation_helpers

  def validate
    super
    validates_presence [:name, :quota_in_bytes]
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

  def to_poro
    {
      :id             => self.id,
      :seats          => self.seats,
      :quota_in_bytes => self.quota_in_bytes,
      :created_at     => self.created_at,
      :updated_at     => self.updated_at,
      :name           => self.name,
      :users          => self.users.map { |u|
        {
          :id       => u.id,
          :username => u.username
        }
      }
    }
  end
end
