# This class currently doesn't serve any purpose except pure data storage
class Tag < Sequel::Model
  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  set_allowed_columns(:name)

  def validate
    super
    errors.add(:name, "can't be blank") if name.blank?
  end
end
