require 'active_record'

class Carto::User < ActiveRecord::Base
  has_many :visualizations, inverse_of: :user
  belongs_to :organization, inverse_of: :users

  has_many :feature_flags_user, dependent: :destroy
  has_many :feature_flags, :through => :feature_flags_user

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url, users.api_key, users.dynamic_cdn_enabled, users.database_schema, users.database_name"

  def public_url
    user_name = organization.nil? ? nil : username
    CartoDB.base_url(self.subdomain, user_name)
  end

  def subdomain
    organization.nil? ? username : organization.name
  end

  def feature_flags_list
    @feature_flag_names ||= (self.feature_flags_user.map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false).map { |ff| ff.name }).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    self.feature_flags_list.present? && self.feature_flags_list.include?(feature_flag_name)
  end

end
