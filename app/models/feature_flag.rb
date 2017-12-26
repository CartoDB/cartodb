# coding: UTF-8

# Feature flags are synchronized through API, so there's no need for validation
class FeatureFlag < Sequel::Model
  include CartoDB::MiniSequel

  one_to_many :feature_flags_user
  
  plugin :association_dependencies
  add_association_dependencies :feature_flags_user => :destroy

  # @param name       String
  # @param restricted boolean

  def self.allowed?(name)
    !!where(name: name, restricted: false).first
  end
end
