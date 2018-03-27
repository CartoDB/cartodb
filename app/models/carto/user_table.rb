require 'active_record'
require_dependency 'carto/db/sanitize'

module Carto
  class UserTable < ActiveRecord::Base
    PRIVACY_PRIVATE = 0
    PRIVACY_PUBLIC = 1
    PRIVACY_LINK = 2

    PRIVACY_VALUES_TO_TEXTS = {
      PRIVACY_PRIVATE => 'private',
      PRIVACY_PUBLIC => 'public',
      PRIVACY_LINK => 'link'
    }.freeze

    def self.column_defaults
      # AR sets privacy = 0 (private) by default, taken from the DB. We want it to be `nil`
      # so the `before_validation` hook sets an appropriate privacy based on the table owner
      super.merge("privacy" => nil)
    end

    # The ::Table service depends on the constructor not being able to set all parameters, only these are allowed
    # This is done so things like name changes are forced to go through ::Table.name= to ensure renaming behaviour
    attr_accessible :privacy, :tags, :description

    belongs_to :user

    belongs_to :map, inverse_of: :user_table

    belongs_to :data_import

    has_many :automatic_geocodings, inverse_of: :table, class_name: Carto::AutomaticGeocoding,
                                    foreign_key: :table_id, dependent: :destroy

    # Disabled to avoid conflicting with the `tags` field. This relation is updated by ::Table.manage_tags.
    # TODO: We can remove both the `user_tables.tags` field and the `tags` table in favour of the canonical viz tags.
    # has_many :tags, foreign_key: :table_id

    has_many :layers_user_table
    has_many :layers, through: :layers_user_table

    before_validation :set_default_table_privacy

    validates :user, presence: true
    validate :validate_user_not_viewer
    validates :name, uniqueness: { scope: :user_id }
    validates :name, exclusion: Carto::DB::Sanitize::RESERVED_TABLE_NAMES
    validates :privacy, inclusion: [PRIVACY_PRIVATE, PRIVACY_PUBLIC, PRIVACY_LINK].freeze
    validate :validate_privacy_changes

    before_create :service_before_create
    after_create :create_canonical_visualization, unless: :map
    after_create :service_after_create
    after_save :service_after_save

    # The `destroyed?` check is needed to avoid the hook running twice when deleting a table from the ::Table service
    # as it is triggered directly, and a second time from canonical visualization destruction hooks.
    # TODO: This can be simplified after deleting the old UserTable model
    before_destroy :ensure_not_viewer
    before_destroy :cache_dependent_visualizations, unless: :destroyed?
    after_destroy :destroy_dependent_visualizations
    after_destroy :service_after_destroy

    def geometry_types
      @geometry_types ||= service.geometry_types
    end

    # Estimated size
    def size
      row_count_and_size[:size]
    end

    def table_size
      service.table_size
    end

    # Estimated row_count. Preferred: `estimated_row_count`
    def row_count
      row_count_and_size[:row_count]
    end

    # Estimated row count and size. Preferred `estimated_row_count` for row count.
    def row_count_and_size
      @row_count_and_size ||= service.row_count_and_size
    end

    def service
      @service ||= ::Table.new(user_table: self)
    end

    def set_service(table)
      @service = table
    end

    def visualization
      map.visualization if map
    end

    def synchronization
      visualization.synchronization if visualization
    end

    def fully_dependent_visualizations
      affected_visualizations.select { |v| v.fully_dependent_on?(self) }
    end

    def accessible_dependent_derived_maps
      affected_visualizations.select { |v| (v.has_read_permission?(user) && v.derived?) ? v : nil }
    end

    def partially_dependent_visualizations
      affected_visualizations.select { |v| v.partially_dependent_on?(self) }
    end

    def dependent_visualizations
      affected_visualizations.select { |v| v.dependent_on?(self) }
    end

    def name_for_user(other_user)
      is_owner?(other_user) ? name : fully_qualified_name
    end

    def private?
      privacy == PRIVACY_PRIVATE
    end

    def public?
      privacy == PRIVACY_PUBLIC
    end

    def public_with_link_only?
      privacy == PRIVACY_LINK
    end

    def privacy_text
      visualization_privacy.upcase
    end

    def visualization_privacy
      PRIVACY_VALUES_TO_TEXTS[privacy]
    end

    def readable_by?(user)
      !private? || is_owner?(user) || visualization_readable_by?(user)
    end

    def raster?
      service.is_raster?
    end

    def geometry_type
      service.the_geom_type || 'geometry'
    end

    def estimated_row_count
      service.estimated_row_count
    end

    def actual_row_count
      service.actual_row_count
    end

    def sync_table_id
      self.table_id = service.get_table_id
    end

    def permission
      visualization.permission if visualization
    end

    def external_source_visualization
      data_import.try(:external_data_imports).try(:first).try(:external_source).try(:visualization)
    end

    def table_visualization
      map.visualization if map
    end

    def update_cdb_tablemetadata
      service.update_cdb_tablemetadata
    end

    def save_changes
      # TODO: Compatibility with Sequel model, can be removed afterwards. Used in ::Table.set_the_geom_column!
      save if changed?
    end

    def tags=(value)
      return unless value
      super(value.split(',').map(&:strip).reject(&:blank?).uniq.join(','))
    end

    # TODO: Compatibility with Sequel model, can be removed afterwards.
    def set_tag_array(tag_array)
      self.tags = tag_array.join(',')
    end

    # TODO: This is related to an incompatibility between visualizations models, `get_related_tables`, See #11705
    def privacy_text_for_vizjson
      privacy == PRIVACY_LINK ? 'PUBLIC' : privacy_text
    end

    def automatic_geocoding
      automatic_geocodings.first
    end

    def is_owner?(user)
      return false unless user
      user_id == user.id
    end

    private

    def default_privacy_value
      user.try(:default_table_privacy)
    end

    def set_default_table_privacy
      self.privacy ||= default_privacy_value
    end

    def fully_qualified_name
      "\"#{user.database_schema}\".#{name}"
    end

    def affected_visualizations
      layers.map(&:visualization).uniq.compact
    end

    def visualization_readable_by?(user)
      user && permission && permission.user_has_read_permission?(user)
    end

    def validate_user_not_viewer
      errors.add(:user, "Viewer users can't create tables") if user.try(:viewer)
    end

    def validate_privacy_changes
      if !user.try(:private_tables_enabled) && !public? && (new_record? || privacy_changed?)
        errors.add(:privacy, 'unauthorized to create private tables')
      end
    end

    def create_canonical_visualization
      visualization = Carto::VisualizationFactory.create_canonical_visualization(self)
      update_attribute(:map, visualization.map)
      visualization.map.set_default_boundaries!
    end

    def cache_dependent_visualizations
      @fully_dependent_visualizations_cache = fully_dependent_visualizations
      @partially_dependent_visualizations_cache = partially_dependent_visualizations
    end

    def destroy_dependent_visualizations
      table_visualization.try(:delete_from_table)
      @fully_dependent_visualizations_cache.each(&:destroy)
      @partially_dependent_visualizations_cache.each do |visualization|
        visualization.unlink_from(self)
      end
    end

    def ensure_not_viewer
      # Loading ::User is a workaround for User deletion: viewer attribute change is not visible at AR transaction
      raise "Viewer users can't destroy tables" if user && user.viewer && ::User[user_id].viewer
    end

    def service_before_create
      service.before_create
    end

    def service_after_create
      service.after_create
    end

    def service_after_save
      service.after_save
    end

    def service_after_destroy
      service.after_destroy
    end
  end
end
