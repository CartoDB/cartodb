module Carto
  class UserStateManager
    REQUEST_CODE_BY_STATE = {
      locked: {
        %r{^\/(builder|viz|me|page|tag|maps|dataset|tables|sitemap)} => { code: 404 },
        %r{^\/api} => { code: 403 },
        %r{^\/(dashboard|account|profile|your_apps)} => {
          code: 302,
          redirect_path: 'upgrade_trial'
        }
      }
    }.freeze

    def self.manage_request(user, request)
      REQUEST_CODE_BY_STATE[user.state.to_sym].each do |path_regexp, value|
        return value[:code], value[:redirect_path] if request.path =~ path_regexp
      end
      nil
    end
  end
end
