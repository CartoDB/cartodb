module CartoDB
  module ControllerFlows
    module Public

      class Maps

        def initialize(ctrl)
          @ctrl = ctrl
        end

        def new_organization_content(org)
          @ctrl.new_maps_for_organization(org)
        end

        def old_organization_content(org)
          @ctrl.old_maps_for_organization(org)
        end

        def organization_path
          CartoDB.path(@ctrl, 'public_visualizations_home')
        end

        def render_404
          @ctrl.render_not_found
        end

        def new_user_content(user)
          @ctrl.new_maps_for_user(user)
        end

        def old_user_content(user)
          @ctrl.old_maps_for_user(user)
        end
      end

    end
  end
end
