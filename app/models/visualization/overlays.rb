
# encoding: utf-8
require 'sequel'
require_relative '../../../services/data-repository/backend/sequel'

# encoding: utf-8
module CartoDB
  module Visualization
    class Overlays

      def initialize(visualization)
        @visualization = visualization
      end

      def create_legacy_overlays
        create_zoom_overlay(@visualization, 6)
        create_loader_overlay(@visualization, 8)
      end

      def create_default_overlays
        create_share_overlay(@visualization, 2)
        create_search_overlay(@visualization, 3)
        create_zoom_overlay(@visualization, 6)
        create_loader_overlay(@visualization, 8)

        # nil check added to support feature flag check (see #6108) without breaking backguards compatibility
        if @visualization.user.nil? || !@visualization.user.has_feature_flag?('disabled_cartodb_logo')
          create_logo_overlay(@visualization, 9)
        end
      end

      def get_overlay_by_type(t)
        @visualization.overlays.find { |oo| oo.type == t }
      end

      def create_overlays_from_url_options(url_options)
        create_default_overlays
        map_updated = false

        return if not url_options

        # parse from url options
        opts = CGI::parse(url_options).deep_symbolize_keys
        opts.each_pair do |opt, value|
          bool_value = value[0] == 'true'
          overlay = nil
          case opt
          when :title, :description
            overlay = get_overlay_by_type('header')
            # if not present, cartodb.js will create the title and description, so don't add them here
            if overlay
              overlay.options['extra']['show_title'] = opts[:title] == 'true'
              overlay.options['extra']['show_description'] = opts[:description] == 'true'
              bool_value = opts[:title] == 'true' || opts[:description] == 'true'
              overlay.show.save if overlay && bool_value
            end
          when :shareable
            overlay = get_overlay_by_type('share')
            overlay.hide.save if overlay && !bool_value
          when :search
            overlay = get_overlay_by_type('search')
            overlay.hide.save if overlay && !bool_value
          when :layer_selector
            overlay = get_overlay_by_type('layer_selector')
            overlay.show.save if overlay && bool_value
          when :fullscreen
            overlay = get_overlay_by_type('fullscreen')
            overlay.show.save if overlay && bool_value
          when :cartodb_logo
            overlay = get_overlay_by_type('logo')
            overlay.hide.save if overlay && !bool_value

          # map stuff, already in the viz
          when :legends, :scrollwheel
            if not map_updated
              map = @visualization.map
              map_needs_save = false
              legends = opts[:legends] == 'true'
              if map.legends != legends
                map_needs_save = true
              end
              scrollwheel = opts[:scrollwheel] == 'true'
              if map.scrollwheel != scrollwheel
                map_needs_save = true
              end
              if map_needs_save
                # query directly the database because it's a simple update and
                # doing though the ORM raises requests to the tiler (not needed in
                # this case)
                # https://mondaybynoon.com/wp-content/uploads/xVyoSl.jpg
                Sequel::Model(:maps).fetch(%{
                  UPDATE maps SET scrollwheel= ?, legends = ? WHERE id = ?
                }, scrollwheel, legends, map.id).first
              end
              map_updated = true
            end

            # when :zoom
            # when :center_lat
            # when :center_lon
            #
            # not parsed, already stored in layers visible option
            # when :sublayer_options
          end
        end
      end

      def create_logo_overlay(member, order)
        options = { display: true, x: 10, y: 40 }

        member = Carto::Overlay.new(
          order: order,
          type: "logo",
          template: '',
          options: options,
          visualization_id: member.id
        )

        member.save
      end

      def generate_overlay(id, options, type, order)
        Carto::Overlay.new(
          order: order,
          type: type,
          template: "",
          options: options,
          visualization_id: id
        )
      end

      def create_loader_overlay(member, order)
        options = { display: true, x: 20, y: 150 }

        member = Carto::Overlay.new(
          order: order,
          type: "loader",
          template: '<div class="loader" original-title=""></div>',
          options: options,
          visualization_id: member.id
        )

        member.save
      end

      def create_zoom_overlay(member, order)
        options = { display: true, x: 20, y: 20 }

        member = Carto::Overlay.new(
          order: order,
          type: "zoom",
          template: '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>',
          options: options,
          visualization_id: member.id
        )

        member.save
      end

      def create_fullscreen_overlay(member, order)
        options = { display: false, x: 20, y: 172 }

        member = generate_overlay(member.id, options, "fullscreen", order)
        member.save
      end

      def create_share_overlay(member, order)
        options = { display: true, x: 20, y: 20 }

        member = generate_overlay(member.id, options, "share", order)
        member.save
      end

      def create_search_overlay(member, order)
        options = { display: true, x: 60, y: 20 }

        member = generate_overlay(member.id, options, "search", order)
        member.save
      end

      def create_layer_selector_overlay(member, order)
        options = { display: false, x: 212, y: 20 }

        member = generate_overlay(member.id, options, "layer_selector", order)
        member.save
      end

      def create_header_overlay(member, order, show_title = false, show_description = false)
        options = {
          display: false,
          extra: { title: member.name, description: member.description, show_title: show_title, show_description: show_description }
        }

        member = generate_overlay(member.id, options, "header", order)
        member.save
      end
    end
  end
end
