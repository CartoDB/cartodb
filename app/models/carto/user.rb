require 'active_record'

class Carto::User < ActiveRecord::Base
  has_many :visualizations, inverse_of: :user
  belongs_to :organization, inverse_of: :users

  def public_url
    user_name = organization.nil? ? nil : username
    CartoDB.base_url(self.subdomain, user_name)
  end

  def subdomain
    organization.nil? ? username : organization.name
  end

end
