module CartoDB
  module Visualization
    class Overlays

      def initialize(visualization)
        @visualization = visualization
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

      private

      def create_logo_overlay(member, order)
        options = { display: true, x: 10, y: 40 }

        Carto::Overlay.new(
          order: order,
          type: "logo",
          template: '',
          options: options,
          visualization_id: member.id
        ).save
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

        Carto::Overlay.new(
          order: order,
          type: "loader",
          template: '<div class="loader" original-title=""></div>',
          options: options,
          visualization_id: member.id
        ).save
      end

      def create_zoom_overlay(member, order)
        options = { display: true, x: 20, y: 20 }

        Carto::Overlay.new(
          order: order,
          type: "zoom",
          template: '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>',
          options: options,
          visualization_id: member.id
        ).save
      end

      def create_share_overlay(member, order)
        options = { display: true, x: 20, y: 20 }

        generate_overlay(member.id, options, "share", order).save
      end

      def create_search_overlay(member, order)
        options = { display: true, x: 60, y: 20 }

        generate_overlay(member.id, options, "search", order).save
      end
    end
  end
end
