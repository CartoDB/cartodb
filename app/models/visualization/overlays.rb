
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

      def create_default_overlays
        create_header_overlay(@visualization, 1)
        create_share_overlay(@visualization, 2)
        create_search_overlay(@visualization, 3)
        create_layer_selector_overlay(@visualization, 4)
        create_zoom_overlay(@visualization, 6)
        create_fullscreen_overlay(@visualization, 7)
        create_zoom_info_overlay(@visualization, 8)
        create_loader_overlay(@visualization, 9)
        create_logo_overlay(@visualization, 10)
      end

      def create_overlays_from_url_options(url_options)
        header_created = false

        # zoom and loader is always added
        create_zoom_overlay(@visualization, 6)
        create_loader_overlay(@visualization, 9)

        return if not url_options

        # parse from url options
        opts = CGI::parse(url_options).deep_symbolize_keys
        opts.each_pair { |opt, value|
          bool_value = value[0] == 'true'
          case opt
            when :title, :description
              if not header_created
                create_header_overlay(@visualization, 1, opts[:title] == 'true', opts[:description] == 'true')
                header_created = true
              end
            when :shareable
              create_share_overlay(@visualization, 2) if bool_value
            when :search
              create_search_overlay(@visualization, 3) if bool_value
            when :layer_selector
              create_layer_selector_overlay(@visualization, 4) if bool_value
            when :fullscreen
              create_fullscreen_overlay(@visualization, 7) if bool_value
            when :cartodb_logo
              create_logo_overlay(@visualization, 10) if bool_value

            # map stuff, already in the viz
            when :legends
            when :scrollwheel
              map = @visualization.map
              map.scrollwheel = bool_value
              map.save

            #when :zoom
            #when :center_lat
            #when :center_lon
            #
            # not parsed, already stored in layers visible option
            #when :sublayer_options
          end
        }

      end

      def create_logo_overlay(member, order)

        options = { :display => true, :x => 10, :y => 40 }

        member = CartoDB::Overlay::Member.new(
          order: order,
          type: "logo",
          template: '',
          options: options,
          visualization_id: member.id
        )

        member.store
      end

      def generate_overlay(id, options, type, order)

        return CartoDB::Overlay::Member.new(
          order: order,
          type: type,
          template: "",
          options: options,
          visualization_id: id
        )

      end


      def create_loader_overlay(member, order)

        options = { :display => true, :x => 20, :y => 192 }

        member = CartoDB::Overlay::Member.new(
          order: order,
          type: "loader",
          template: '<div class="loader" original-title=""></div>',
          options: options,
          visualization_id: member.id
        )

        member.store

      end


      def create_zoom_overlay(member, order)

        options = { :display => true, :x => 20, :y => 20 } 

        member = CartoDB::Overlay::Member.new(
          order: order,
          type: "zoom",
          template: '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>',
          options: options,
          visualization_id: member.id
        )

        member.store

      end



      def create_zoom_info_overlay(member, order)

        options = { :display => true, :x => 20, :y => 100 } 

        member = generate_overlay(member.id, options, "zoom_info", order)
        member.store

      end

      def create_fullscreen_overlay(member, order)

        options = { :display => false, :x => 20, :y => 172 } 

        member = generate_overlay(member.id, options, "fullscreen", order)
        member.store

      end

      def create_share_overlay(member, order)

        options = { :display => true, :x => 20, :y => 20 } 

        member = generate_overlay(member.id, options, "share", order)
        member.store

      end

      def create_search_overlay(member, order)

        options = { :display => true, :x => 60, :y => 20 } 

        member = generate_overlay(member.id, options, "search", order)
        member.store

      end

      def create_layer_selector_overlay(member, order)

        options = { :display => false, :x => 212, :y => 20 }

        member = generate_overlay(member.id, options, "layer_selector", order)
        member.store

      end

      def create_header_overlay(member, order, show_title=false, show_description=false)

        options = {
          :display => false,
          :extra => { :title => member.name, :description => member.description, :show_title => show_title, :show_description => show_description}
        }

        member = generate_overlay(member.id, options, "header", order)
        member.store

      end

    end
  end
end
