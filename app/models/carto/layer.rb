require 'active_record'
require 'active_record/connection_adapters/postgresql/oid/json'
require_relative './carto_json_serializer'
require_dependency 'carto/table_utils'
require_dependency 'carto/query_rewriter'

module Carto
  module LayerTableDependencies
    private

    def affected_tables
      return [] unless maps.first.present? && options.present?
      node_id = options.symbolize_keys[:source]
      if node_id.present?
        visualization_id = map.visualization.id
        node = AnalysisNode.find_by_natural_id(visualization_id, node_id)
        return [] unless node
        dependencies = node.source_descendants.map do |source_node|
          tables_by_query = tables_from_query(source_node.params[:query])
          table_name = source_node.options[:table_name]
          tables_by_name = table_name ? tables_from_names([table_name], user) : []

          tables_by_query.present? ? tables_by_query : tables_by_name
        end
        dependencies.flatten.compact.uniq
      else
        tables_by_query = tables_from_query_option
        dependencies = tables_by_query.present? ? tables_by_query : tables_from_table_name_option
        dependencies.compact.uniq
      end
    end

    def tables_from_query_option
      tables_from_query(query)
    end

    def tables_from_query(query)
      query.present? ? tables_from_names(affected_table_names(query), user) : []
    rescue StandardError => e
      # INFO: this covers changes that CartoDB can't track, so we must handle it gracefully.
      # For example, if layer SQL contains wrong SQL (uses a table that doesn't exist, or uses an invalid operator).
      # This warning level is checked in tests to ensure that embed view does not need user DB connection,
      # so we need to keep it (or change the tests accordingly)
      log_warning(message: 'Could not retrieve tables from query', exception: e, current_user: user, layer: attributes)
      []
    end

    def tables_from_table_name_option
      return [] if options.empty?
      sym_options = options.symbolize_keys
      user_name = sym_options[:user_name]
      table_name = sym_options[:table_name]
      schema_prefix = user_name.present? && table_name.present? && !table_name.include?('.') ? %{"#{user_name}".} : ''
      tables_from_names(["#{schema_prefix}#{table_name}"], user)
    end
  end

  class Layer < ActiveRecord::Base
    include Carto::TableUtils
    include LayerTableDependencies
    include Carto::QueryRewriter

    attribute :options, ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Json.new
    attribute :infowindow, ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Json.new
    attribute :tooltip, ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Json.new

    serialize :options, CartoJsonSerializer
    serialize :infowindow, CartoJsonSerializer
    serialize :tooltip, CartoJsonSerializer

    has_many :layers_maps, dependent: :destroy
    has_many :maps, through: :layers_maps, after_add: :after_added_to_map

    has_many :layers_user, dependent: :destroy
    has_many :users, through: :layers_user, after_add: :set_default_order

    has_many :layers_user_tables, dependent: :destroy
    has_many :user_tables, through: :layers_user_tables, class_name: Carto::UserTable

    has_many :widgets, -> { order(:order) }, class_name: Carto::Widget
    has_many :legends, -> { order(:created_at) }, class_name: Carto::Legend, dependent: :destroy

    has_many :layer_node_styles

    before_destroy :ensure_not_viewer
    before_save :lock_user_tables
    after_save :invalidate_maps, :update_layer_node_style
    after_save :register_table_dependencies, if: :data_layer?

    ALLOWED_KINDS = %w{carto tiled background gmapsbase torque wms}.freeze

    validates :kind, inclusion: { in: ALLOWED_KINDS }
    validate :validate_not_viewer

    TEMPLATES_MAP = {
      'table/views/infowindow_light' =>               'infowindow_light',
      'table/views/infowindow_dark' =>                'infowindow_dark',
      'table/views/infowindow_light_header_blue' =>   'infowindow_light_header_blue',
      'table/views/infowindow_light_header_yellow' => 'infowindow_light_header_yellow',
      'table/views/infowindow_light_header_orange' => 'infowindow_light_header_orange',
      'table/views/infowindow_light_header_green' =>  'infowindow_light_header_green',
      'table/views/infowindow_header_with_image' =>   'infowindow_header_with_image'
    }.freeze

    def set_default_order(parent)
      # Reload maps upon adding this layer to a map (AR doesn't do this automatically)
      maps.reload if persisted?

      return unless order.nil?
      max_order = parent.layers.map(&:order).compact.max || -1
      self.order = max_order + 1
      save if persisted?
    end

    # Sequel model compatibility (for TableBlender)
    # TODO: Remove this after `::UserTable` deletion, and inline into TableBlender
    def add_map(map)
      map.layers << self
    end

    def user_tables_readable_by(user)
      user_tables.select { |ut| ut.readable_by?(user) }
    end

    def data_readable_by?(user)
      user_tables.all? { |ut| ut.readable_by?(user) }
    end

    def legend
      @legend ||= options['legend']
    end

    def qualified_table_name(schema_owner_user = nil)
      table_name = options['table_name']
      if table_name.present? && table_name.include?('.')
        table_name
      else
        schema_prefix = schema_owner_user.nil? ? '' : "#{schema_owner_user.sql_safe_database_schema}."
        "#{schema_prefix}#{safe_table_name_quoting(options['table_name'])}"
      end
    end

    # INFO: for vizjson v3 this is not used, see VizJSON3LayerPresenter#to_vizjson_v3
    def infowindow_template_path
      if infowindow.present? && infowindow['template_name'].present?
        template_name = TEMPLATES_MAP.fetch(infowindow['template_name'], infowindow['template_name'])
        Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates/#{template_name}.jst.mustache")
      end
    end

    # INFO: for vizjson v3 this is not used, see VizJSON3LayerPresenter#to_vizjson_v3
    def tooltip_template_path
      if tooltip.present? && tooltip['template_name'].present?
        template_name = TEMPLATES_MAP.fetch(tooltip['template_name'], tooltip['template_name'])
        Rails.root.join("lib/assets/javascripts/cartodb/table/views/tooltip/templates/#{template_name}.jst.mustache")
      end
    end

    def basemap?
      gmapsbase? || tiled?
    end

    def base_layer?
      tiled? || background? || gmapsbase? || wms?
    end

    def torque?
      kind == 'torque'
    end

    def data_layer?
      !base_layer?
    end

    def user_layer?
      tiled? || background? || gmapsbase? || wms?
    end

    def named_map_layer?
      tiled? || background? || gmapsbase? || wms? || carto?
    end

    def carto?
      kind == 'carto'
    end

    def tiled?
      kind == 'tiled'
    end

    def background?
      kind == 'background'
    end

    def gmapsbase?
      kind == 'gmapsbase'
    end

    def wms?
      kind == 'wms'
    end

    def supports_labels_layer?
      basemap? && options["labels"] && options["labels"]["urlTemplate"]
    end

    def map
      maps[0]
    end

    def visualization
      map.visualization if map
    end

    def user
      @user ||= map.nil? ? nil : map.user
    end

    def default_query(user = nil, database_schema = nil)
      sym_options = options.symbolize_keys
      query = sym_options[:query]

      if query.present?
        query
      else
        user_username = user.nil? ? nil : user.username
        user_name = sym_options[:user_name] || user_username
        table_name = sym_options[:table_name]
        qualify = (user && user.organization_user?) || user_username != user_name

        if table_name.present? && !table_name.include?('.') && user_name.present? && qualify
          "SELECT * FROM #{safe_table_name_quoting(user_name)}.#{safe_table_name_quoting(table_name)}"
        elsif database_schema.present?
          "SELECT * FROM #{safe_table_name_quoting(database_schema)}.#{safe_table_name_quoting(table_name)}"
        else
          "SELECT * FROM #{qualified_table_name}"
        end
      end
    end

    def register_table_dependencies
      if data_layer?
        if persisted?
          user_tables.reload
          maps.reload
        end
        self.user_tables = affected_tables
      end
    end

    def fix_layer_user_information(old_username, new_user, renamed_tables)
      new_username = new_user.username

      if options.key?(:user_name)
        old_username = options[:user_name] || old_username
        options[:user_name] = new_username
      end

      if options.key?(:table_name)
        old_table_name = options[:table_name]
        options[:table_name] = renamed_tables.fetch(old_table_name, old_table_name)
      end

      # query_history is not modified as a safety measure for cases where this naive replacement doesn't work
      query = options[:query]
      options[:query] = rewrite_query(query, old_username, new_user, renamed_tables) if query.present?
    end

    def force_notify_change
      map.force_notify_map_change if map
    end

    def custom?
      CUSTOM_CATEGORIES.include?(category)
    end

    def category
      options && options['category']
    end

    def rename_table(current_table_name, new_table_name)
      return self unless data_layer?
      target_keys = %w{table_name tile_style query}

      targets = options.select { |key, _| target_keys.include?(key) }
      renamed = targets.map do |key, value|
        [key, rename_in(value, current_table_name, new_table_name)]
      end

      self.options = options.merge(renamed.to_h)
      self
    end

    def uses_private_tables?
      user_tables.any?(&:private?)
    end

    def after_added_to_map(map)
      # This avoids unnecessary operations for in-memory logic. Example: Mapcap recreation. See #12473.
      return unless map.persisted?

      set_default_order(map)
      register_table_dependencies
    end

    def depends_on?(user_table)
      layers_user_tables.map(&:user_table_id).include?(user_table.id)
    end

    def source_id
      options.symbolize_keys[:source]
    end

    def qualify_for_organization(owner_username)
      options['query'] = qualify_query(query, options['table_name'], owner_username) if query
    end

    private

    # The table dependencies will only be updated after the layer. However, when deleting them, they need to be deleted
    # before the model. This can cause deadlocks with simultaneous request to update and delete the model.
    # This request a explicit lock to PostgreSQL so the tables are always accessed in the same order. #11443
    def lock_user_tables
      user_tables.lock.all if persisted?
    end

    def rename_in(target, anchor, substitution)
      return if target.blank?
      regex = /(\A|\W+)(#{anchor})(\W+|\z)/
      target.gsub(regex) { |match| match.gsub(anchor, substitution) }
    end

    CUSTOM_CATEGORIES = %w{Custom NASA TileJSON Mapbox WMS}.freeze

    def tables_from_names(table_names, user)
      ::Table.get_all_user_tables_by_names(table_names, user)
    end

    def affected_table_names(query)
      return [] unless query.present?

      query_tables = user.in_database.execute("SELECT unnest(CDB_QueryTablesText(#{user.in_database.quote(query)}))")
      query_tables.column_values(0).uniq
    end

    def query
      options.symbolize_keys[:query]
    end

    def invalidate_maps
      maps.each(&:notify_map_change)
    end

    def ensure_not_viewer
      raise CartoDB::InvalidMember.new(user: "Viewer users can't destroy layers") if user && user.viewer
    end

    def validate_not_viewer
      errors.add(:maps, "Viewer users can't edit layers") if maps.any? { |m| m.user && m.user.viewer }
    end

    def update_layer_node_style
      style = current_layer_node_style
      if style
        style.update_from_layer(self)
        style.save
      end
    end

    def current_layer_node_style
      return unless source_id

      layer_node_styles.find_by(source_id: source_id) ||
        Carto::LayerNodeStyle.new(layer: self, source_id: source_id)
    end

  end
end
