class Organization < Sequel::Model
  one_to_many :users
  plugin :validation_helpers

  def validate
    super
    validates_presence [:name, :quota_in_bytes]
    validates_unique   :name
    validates_format   /^[a-z0-9\-]+$/, :name, message: "must only contain lowercase letters, numbers & hyphens"
  end # validate

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum.to_i
  end

  def assigned_quota
    users_dataset.sum(:quota_in_bytes).to_i
  end

  def unassigned_quota
    quota_in_bytes - assigned_quota
  end
end
