module Carto
  class OverlayFactory
    def self.build_default_overlays(user)
      overlays = [
        build_share_overlay(2),
        build_search_overlay(3),
        build_zoom_overlay(6),
        build_loader_overlay(8)
      ]
      overlays << build_logo_overlay(9) unless user.has_feature_flag?('disabled_cartodb_logo')
      overlays
    end

    # private

    def self.build_logo_overlay(order)
      Carto::Overlay.new(
        order: order,
        type: "logo",
        template: '',
        options: { display: true, x: 10, y: 40 }
      )
    end
    private_class_method :build_logo_overlay

    def self.build_loader_overlay(order)
      Carto::Overlay.new(
        order: order,
        type: 'loader',
        template: '<div class="loader" original-title=""></div>',
        options: { display: true, x: 20, y: 150 }
      )
    end
    private_class_method :build_loader_overlay

    def self.build_zoom_overlay(order)
      Carto::Overlay.new(
        order: order,
        type: 'zoom',
        template: '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>',
        options: { display: true, x: 20, y: 20 }
      )
    end
    private_class_method :build_zoom_overlay

    def self.build_share_overlay(order)
      Carto::Overlay.new(
        order: order,
        type: 'share',
        template: '',
        options: { display: true, x: 20, y: 20 }
      )
    end
    private_class_method :build_share_overlay

    def self.build_search_overlay(order)
      Carto::Overlay.new(
        order: order,
        type: 'search',
        template: '',
        options: { display: true, x: 60, y: 20 }
      )
    end
    private_class_method :build_search_overlay
  end
end
