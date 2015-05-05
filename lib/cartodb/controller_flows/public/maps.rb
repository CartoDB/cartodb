module CartoDB
  module ControllerFlows
    module Public

      class Maps

        def initialize(ctrl)
          @ctrl = ctrl
        end

        def organization_content(org)
          @ctrl.maps_for_organization(org)
        end

        def organization_path
          CartoDB.path(@ctrl, 'public_visualizations_home')
        end

        def render_404
          @ctrl.render_not_found
        end

        def user_content(user)
          @ctrl.maps_for_user(user)
        end
      end

    end
  end
end
