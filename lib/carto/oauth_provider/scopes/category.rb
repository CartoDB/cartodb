module Carto
  module OauthProvider
    module Scopes
      class Category
        attr_reader :description, :icon

        def initialize(description, icon = nil)
          @description = description
          @icon = icon
        end
      end
    end
  end
end
