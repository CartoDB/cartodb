class Carto::MobileApp
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming

  APP_PLATFORMS = %w(android ios xamarin-android xamarin-ios windows-phone).freeze
  APP_TYPES = %w(dev open private).freeze
  MAX_DEV_USERS = 5

  validates :name,          presence: true
  validates :icon_url,      presence: true
  validates :platform,      inclusion: { in: APP_PLATFORMS }
  validates :app_id,        presence: true
  validates :app_type,      inclusion: { in: APP_TYPES }

  attr_accessor :id, :name, :description, :icon_url, :platform, :app_id, :app_type, :license_key, :monthly_users

  def initialize(attributes = {})
    attributes.each do |name, value|
      send("#{name}=", value)
    end
  end

  def persisted?
    id.present?
  end

  def data(current_user, fetch_mobile_platforms: false, fetch_app_types: false)
    Carto::Api::MobileAppPresenter.new(self, current_user, fetch_mobile_platforms, fetch_app_types).data
  end
end
