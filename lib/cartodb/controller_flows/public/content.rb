module CartoDB
  module ControllerFlows
    module Public

      class Content

        def initialize(ctrl, request, renderer)
          @ctrl     = ctrl
          @request  = request
          @renderer = renderer
        end

        def render
          username = CartoDB.extract_subdomain(@request).strip.downcase
          viewed_user = User.where(username: username).first

          if viewed_user.nil?
            org = Organization.where(name: username).first
            unless org.nil?
              if FeatureFlag.allowed?('new_public_dashboard_global')
                return @renderer.new_organization_content(org)
              else
                return @renderer.old_organization_content(org)
              end
            end
          end

          return @renderer.render_404 if viewed_user.nil?

          # Redirect to org url if has only user
          if eligible_for_redirect?(viewed_user)
            # redirect username.host.ext => org-name.host.ext/u/username
            @ctrl.redirect_to CartoDB.base_url(viewed_user.organization.name) <<
              @renderer.organization_path(viewed_user) and return
          end

          if viewed_user.has_feature_flag?('new_public_dashboard')
            return @renderer.new_user_content(viewed_user)
          else
            return @renderer.old_user_content(viewed_user)
          end
        end

        private

        def eligible_for_redirect?(user)
          (CartoDB.subdomains_allowed? || CartoDB.subdomains_optional?) && user.has_organization? &&
            !@request.params[:redirected].present? && CartoDB.extract_real_subdomain(@request) != user.organization.name
        end

      end

    end
  end
end
