module Carto
  module Api
    class GrantablePresenter
      extend Forwardable

      delegate [:to_poro] => :@presenter

      def initialize(grantable)
        case grantable
        when Carto::User, ::User
          @presenter = Carto::Api::GrantableUserPresenter.new(grantable)
        when Carto::Group
          @presenter = Carto::Api::GrantableGroupPresenter.new(grantable)
        else
          raise "Unknown grantable #{grantable}"
        end
      end

    end

    class GrantableUserPresenter

      def initialize(user)
        @user = user
      end

      def to_poro
        {
          id: @user.id,
          type: 'user',
          name: @user.username
        }
      end

    end

    class GrantableGroupPresenter

      def initialize(group)
        @group = group
      end

      def to_poro
        {
          id: @group.id,
          type: 'group',
          name: @group.name
        }
      end

    end

  end
end

