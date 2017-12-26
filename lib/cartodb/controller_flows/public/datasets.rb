module CartoDB
  module ControllerFlows
    module Public

      class Datasets

        def initialize(ctrl)
          @ctrl = ctrl
        end

        def organization_content(org)
          @ctrl.datasets_for_organization(org)
        end

        def organization_path
          CartoDB.path(@ctrl, 'public_datasets_home')
        end

        def render_404
          @ctrl.render_not_found
        end

        def user_content(user)
          @ctrl.datasets_for_user(user)
        end
      end

    end
  end
end
