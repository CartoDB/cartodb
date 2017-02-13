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
      super.merge("privacy" => nil)
    end

    belongs_to :user

    belongs_to :map, inverse_of: :user_table

    belongs_to :data_import

    has_many :automatic_geocodings, inverse_of: :table, class_name: Carto::AutomaticGeocoding, foreign_key: :table_id
    has_many :tags, foreign_key: :table_id

    has_many :layers_user_table
    has_many :layers, through: :layers_user_table

    before_validation :set_default_table_privacy

    validates :user, presence: true
    validate :validate_user_not_viewer
    validates :name, uniqueness: { scope: :user_id }
    validates :name, exclusion: Carto::DB::Sanitize::RESERVED_TABLE_NAMES
    validates :privacy, inclusion: [PRIVACY_PRIVATE, PRIVACY_PUBLIC, PRIVACY_LINK].freeze
    validate :validate_privacy_changes

    def geometry_types
      @geometry_types ||= table.geometry_types
    end

    # Estimated size
    def size
      row_count_and_size[:size]
    end

    def table_size
      table.table_size
    end

    # Estimated row_count. Preferred: `estimated_row_count`
    def row_count
      row_count_and_size[:row_count]
    end

    # Estimated row count and size. Preferred `estimated_row_count` for row count.
    def row_count_and_size
      @row_count_and_size ||= table.row_count_and_size
    end

    def service
      @service ||= ::Table.new(user_table: self)
    end

    def set_service(table)
      @table = table
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
      PRIVACY_VALUES_TO_TEXTS[privacy].upcase
    end

    def readable_by?(user)
      !private? || is_owner?(user) || visualization_readable_by?(user)
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

    private

    def default_privacy_value
      user.try(:private_tables_enabled) ? PRIVACY_PRIVATE : PRIVACY_PUBLIC
    end

    def set_default_table_privacy
      self.privacy ||= default_privacy_value
    end

    def fully_qualified_name
      "\"#{user.database_schema}\".#{name}"
    end

    def is_owner?(user)
      return false unless user
      user_id == user.id
    end

    def affected_visualizations
      layers.map(&:visualization).uniq
    end

    def table
      @table ||= ::Table.new( { user_table: self } )
    end

    def visualization_readable_by?(user)
      user && permission && permission.user_has_read_permission?(user)
    end

    def validate_user_not_viewer
      errors.add(:user, "Viewer users can't create tables") if user && user.viewer
    end

    def validate_privacy_changes
      unless user.try(:private_tables_enabled)
        # If it's a new table and the user is trying to make it private
        if new_record? && private?
          errors.add(:privacy, 'unauthorized to create private tables')
        end

        # if the table exists, is private, but the owner no longer has private privileges
        if !new_record? && private? && privacy_changed?
          errors.add(:privacy, 'unauthorized to modify privacy status to private')
        end

        # cannot change any existing table to 'with link'
        if !new_record? && public_with_link_only? && privacy_changed?
          errors.add(:privacy, 'unauthorized to modify privacy status to public with link')
        end
      end
    end
  end
end
