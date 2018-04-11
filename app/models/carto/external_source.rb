# encoding: UTF-8

require 'active_record'

class Carto::ExternalSource < ActiveRecord::Base
  # Seconds
  REFRESH_INTERVAL = 30*24*60*60

  has_many :external_data_imports, class_name: Carto::ExternalDataImport, dependent: :destroy
  belongs_to :visualization, inverse_of: :external_source
  validates :visualization, :import_url, :rows_counted, :size, presence: true

  before_create :fix_geometry_types_for_insert

  def update_data(import_url, geometry_types, rows_counted, size, username = nil)
    self.import_url = import_url
    # This check avoids a "false change" if the data is actually equal (AR bug on arrays)
    self.geometry_types = geometry_types unless equal_pg_array?(self.geometry_types, geometry_types)
    self.rows_counted = rows_counted
    self.size = size
    self.username = username
    self
  end

  def importable_by?(user)
    user.present? && visualization.user_id == user.id
  end

  private

  # True if array (`['ST_MultiPolygon']`) contains the same elements than string, in PG notation (`{ST_MultiPolygon}`)
  def equal_pg_array?(array, string)
    array = [] if array.nil?
    string = '{}' if string.nil?

    "{#{array.join(',')}}" == string
  end

  def fix_geometry_types_for_insert
    self.geometry_types = Carto::InsertableArray.new(geometry_types) if geometry_types
  end
end
