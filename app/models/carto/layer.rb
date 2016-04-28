require 'active_record'
require_relative './carto_json_serializer'

module Carto
  class Layer < ActiveRecord::Base
    serialize :options, CartoJsonSerializer
    serialize :infowindow, CartoJsonSerializer
    serialize :tooltip, CartoJsonSerializer

    has_many :layers_maps
    has_many :maps, through: :layers_maps

    has_many :layers_user
    has_many :users, through: :layers_user

    has_many :layers_user_table, foreign_key: :layer_id
    has_many :user_tables, through: :layers_user_table, class_name: Carto::UserTable

    has_many :widgets, class_name: Carto::Widget, order: '"order"'

    TEMPLATES_MAP = {
      'table/views/infowindow_light' =>               'infowindow_light',
      'table/views/infowindow_dark' =>                'infowindow_dark',
      'table/views/infowindow_light_header_blue' =>   'infowindow_light_header_blue',
      'table/views/infowindow_light_header_yellow' => 'infowindow_light_header_yellow',
      'table/views/infowindow_light_header_orange' => 'infowindow_light_header_orange',
      'table/views/infowindow_light_header_green' =>  'infowindow_light_header_green',
      'table/views/infowindow_header_with_image' =>   'infowindow_header_with_image'
    }

    def public_values
      {
        options: options,
        kind: kind,
        infowindow: infowindow,
        tooltip: tooltip,
        id: id,
        order: order
      }
    end

    def affected_tables
      (tables_from_query_option + tables_from_table_name_option).compact.uniq
    end

    def affected_tables_readable_by(user)
      affected_tables.select { |ut| ut.readable_by?(user) }
    end

    def data_readable_by?(user)
      affected_tables.find { |ut| !ut.readable_by?(user) }.nil?
    end

    def legend
      @legend ||= options['legend']
    end

    def qualified_table_name(viewer_user)
      "#{viewer_user.sql_safe_database_schema}.#{options['table_name']}"
    end

    # INFO: for vizjson v3 this is not used, see VizJSON3LayerPresenter#to_vizjson_v3
    def infowindow_template_path
      if self.infowindow.present? && self.infowindow['template_name'].present?
        template_name = TEMPLATES_MAP.fetch(self.infowindow['template_name'], self.infowindow['template_name'])
        Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates/#{template_name}.jst.mustache")
      else
        nil
      end
    end

    # INFO: for vizjson v3 this is not used, see VizJSON3LayerPresenter#to_vizjson_v3
    def tooltip_template_path
      if self.tooltip.present? && self.tooltip['template_name'].present?
        template_name = TEMPLATES_MAP.fetch(self.tooltip['template_name'], self.tooltip['template_name'])
        Rails.root.join("lib/assets/javascripts/cartodb/table/views/tooltip/templates/#{template_name}.jst.mustache")
      else
        nil
      end
    end

    def basemap?
      ["gmapsbase", "tiled"].include?(kind)
    end

    def base?
      ['tiled', 'background', 'gmapsbase', 'wms'].include?(kind)
    end

    def torque?
      kind == 'torque'
    end

    def supports_labels_layer?
      basemap? && options["labels"] && options["labels"]["url"]
    end

    private

    def tables_from_query_option
      ::Table.get_all_user_tables_by_names(affected_table_names, user)
    rescue => exception
      # INFO: this covers changes that CartoDB can't track. For example, if layer SQL contains wrong SQL (uses a table that doesn't exist, or uses an invalid operator).
      CartoDB.notify_debug('Could not retrieve tables from query', { user: user, layer: self })
      []
    end

    def affected_table_names
      return [] unless query.present?

      # TODO: This is the same that CartoDB::SqlParser().affected_tables does. Maybe remove that class?
      query_tables = user.in_database.execute("SELECT CDB_QueryTables(#{user.in_database.quote(query)})").first
      query_tables['cdb_querytables'].split(',').map do |table_name|
        t = table_name.gsub!(/[\{\}]/, '')
        (t.blank? ? nil : t)
      end.compact.uniq
    end

    def tables_from_table_name_option
      return[] if options.empty?
      ::Table.get_all_user_tables_by_names([options.symbolize_keys[:table_name]], user)
    end

    def query
      options.symbolize_keys[:query]
    end

    def user
      @user ||= maps.first.user
    end

  end
end
