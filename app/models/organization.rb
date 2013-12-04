class Organization < Sequel::Model
  one_to_many :users  

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum
  end
end
