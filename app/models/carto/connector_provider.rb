require 'carto/connector'

class Carto::ConnectorProvider < ActiveRecord::Base
  validates :name, presence: true
  validates :name, uniqueness: true

  has_many :connector_configurations
end
