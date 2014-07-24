require_relative 'utils'

module CartoDB
  module Relocator
    class OrganizationTester
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
        @dbname = @config[:dbname]
        @username = @config[:username]
        @user_obj = @config[:user_object]
      end

    end
  end
end

