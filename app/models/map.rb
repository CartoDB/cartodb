class Map < Sequel::Model
  many_to_many :layers

  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?
  end
end
