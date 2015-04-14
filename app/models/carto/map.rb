require 'active_record'

class Carto::Map < ActiveRecord::Base

  has_and_belongs_to_many :layers, class_name: 'Carto::Layer', order: :order

  has_and_belongs_to_many :carto_and_torque_layers, class_name: 'Carto::Layer', conditions: "kind in ('carto', 'torque')"

  belongs_to :user

end
