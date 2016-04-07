require_relative '../../../helpers/carto/html_safe'
require_dependency 'carto/api/vizjson_presenter'

module Carto
  module Admin
    class VisualizationPublicMapAdapter
      extend Forwardable
      include Carto::HtmlSafe
          GEOMETRY_MAPPING = {
            'st_multipolygon'    => 'polygon',
            'st_polygon'         => 'polygon',
            'st_multilinestring' => 'line',
            'st_linestring'      => 'line',
            'st_multipoint'      => 'point',
            'st_point'           => 'point'
          }

      delegate [
        :type_slide?, :has_permission?, :derived?, :organization, :organization?, :id, :likes,
        :password_protected?, :varnish_key, :related_tables, :password_valid?, :get_auth_tokens, :table, :name,
        :overlays, :created_at, :updated_at, :description, :mapviews, :geometry_types, :privacy, :tags,
        :surrogate_key, :has_password?, :total_mapviews, :is_viewable_by_user?, :is_accesible_by_user?,
        :can_be_cached?, :is_privacy_private?, :source, :kind_raster?
      ] => :visualization

      attr_reader :visualization

      def initialize(visualization, current_viewer, context)
        @visualization = visualization
        @current_viewer = current_viewer
        @context = context
      end

      def to_vizjson(options = {})
        Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson(options)
      end

      def is_owner?(user)
        @visualization.owner_user?(user)
      end

      def to_hash(options={})
        # TODO: using an Api presenter here smells, refactor
        presenter = Carto::Api::VisualizationPresenter.new(@visualization, @current_viewer, @context, options.merge(show_stats: false))
        options.delete(:public_fields_only) === true ? presenter.to_public_poro : presenter.to_poro
      end

      def map
        Carto::Admin::MapPublicMapAdapter.new(@visualization.map)
      end

      def user
        Carto::Admin::UserPublicMapAdapter.new(@visualization.user)
      end

      def liked_by?(user_id)
        @visualization.is_liked_by_user_id?(user_id)
      end

      def description_html_safe
        markdown_html_safe(description)
      end

      def source_html_safe
        markdown_html_safe(source)
      end

      def description_clean
        markdown_html_clean(description)
      end

      # TODO: remove is_ prefixed methods from visualization
      def private?
        @visualization.private?
      end

      def public?
        @visualization.is_public?
      end

      def public_with_link?
        @visualization.is_link_privacy?
      end

      def related_canonical_visualizations
        @visualization.related_canonical_visualizations.map { |rv|
          Carto::Admin::VisualizationPublicMapAdapter.new(rv, @current_viewer, @context) if rv.is_public?
        }.compact
      end

      def related_visualizations_geometry_types
        related_canonical_visualizations.collect(&:geometry_types).flatten.uniq
      end

      def related_tables_geometry_types
        related_tables.collect(&:geometry_types).flatten.uniq
      end

      def related_visualizations_simple_geometry_types
        simplify_geometry_types(related_visualizations_geometry_types)
      end

      def related_tables_simple_geometry_types
        simplify_geometry_types(related_tables_geometry_types)
      end

      def map_zoom
        map.nil? ? nil : map.zoom
      end

      def display_name_or_name
        @visualization.display_name.nil? ? @visualization.name : @visualization.display_name
      end

      private

      def simplify_geometry_types(geometry_types)
        geometry_types.map { |gt| GEOMETRY_MAPPING.fetch(gt.downcase, "unknown: #{gt}") }
      end

    end
  end
end
