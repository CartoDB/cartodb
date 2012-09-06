# This makes factory_girl compatible with Sequel
class Sequel::Model
  def save!
    save(:validate=>false)
  end
end
