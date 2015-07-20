module CartoDB
  module ControllerFlows
    module Public

      class Content

        def initialize(ctrl, request, renderer)
          @ctrl     = ctrl
          @request  = request
          @renderer = renderer
        end

        def viewed_user
          User.where(username: username).first
        end

        def viewed_organization
          Organization.where(name: username).first
        end

        def render
          viewed_user = self.viewed_user

          if viewed_user.nil?
            org = self.viewed_organization
            unless org.nil?
              return @renderer.organization_content(org)
            end
          end

          return @renderer.render_404 if viewed_user.nil?

          # Redirect to org url if has only user
          if eligible_for_redirect?(viewed_user)
            # redirect username.host.ext => org-name.host.ext/u/username
            @ctrl.redirect_to CartoDB.base_url(viewed_user.organization.name, viewed_user.username) <<
                                @renderer.organization_path and return
          end

          @renderer.user_content(viewed_user)
        end

        private

        def username
          CartoDB.extract_subdomain(@request).strip.downcase
        end

        def eligible_for_redirect?(user)
          return if CartoDB.subdomainless_urls?
          user.has_organization? && !@request.params[:redirected].present? &&
            CartoDB.subdomain_from_request(@request) != user.organization.name
        end

      end

    end
  end
end
