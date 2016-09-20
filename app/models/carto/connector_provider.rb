# encoding: UTF-8

require 'carto/connector'

class Carto::ConnectorProvider < ActiveRecord::Base
  validates :name, presence: true
  validates :name, uniqueness: true

  has_many :connector_configurations

  private

end

#
# User methods (Carto::User too?)
#
# def connector_configuration(provider)
#   config = ConnectorConfiguration.where(user_id: id, provider: provider)
#   if config.blank? && organization.present?
#     config = ConnectorConfiguration.where(organization_id: id, provider: provider)
#   end
#   config
# end
