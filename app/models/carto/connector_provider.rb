require 'carto/connector'

class Carto::ConnectorProvider < ApplicationRecord
  validates :name, presence: true
  validates :name, uniqueness: true

  has_many :connector_configurations
end
