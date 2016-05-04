class MobileApp
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming

  APP_PLATFORMS = %w(android ios xamarin-android xamarin-ios windows-phone).freeze
  APP_TYPES = %w(dev open private).freeze

  validates :name,          presence: true
  validates :icon_url,      presence: true
  validates :platform,      inclusion: { in: APP_PLATFORMS }
  validates :app_id,        presence: true
  validates :app_type,      inclusion: { in: APP_TYPES }
  validates :license_key,   presence: true
  validates :monthly_users, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  attr_accessor :id, :name, :description, :icon_url, :platform, :app_id, :app_type, :license_key, :monthly_users

  def initialize(attributes = {})
    attributes.each do |name, value|
      send("#{name}=", value)
    end
  end

  def persisted?
    id.present? && name.present? && icon_url.present? && app_id.present? && license_key.present?
  end

end