# coding: UTF-8

class Tag < Sequel::Model
  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  set_allowed_columns(:name)

  def validate
    super

    errors.add(:name, "can't be blank") if name.blank?
  end

  # TODO this should be on the user model
  def self.load_user_tags(user_id, options = {})
    options[:limit] ||= 5
    fetch("SELECT tags.name, count(*) AS count
                        FROM tags
                        WHERE tags.user_id = ?
                        GROUP BY tags.name
                        ORDER BY count DESC LIMIT ?", user_id, options[:limit]).all.map{|t| t.values }
  end
end
