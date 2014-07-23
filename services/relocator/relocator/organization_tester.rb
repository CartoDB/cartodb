require_relative 'utils'

module CartoDB
  module Relocator
    class OrganizationTester
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
      end

      def check_permissions(user)
        check_public_permissions(user)
      end 
      def check_public_permissions(user)
        expectations_public_user = {
          "select has_schema_privilege('#{user.database_public_username}', 'public', 'USAGE');" => true,
          "select has_schema_privilege('#{user.database_public_username}', 'cartodb', 'USAGE');" => true,
          "select pg_has_role('#{user.database_public_username}', 'publicuser', 'USAGE');" => true,
          "select pg_function_is_visible('postgis_full_version()'::regprocedure);" => true
        }
        # Check for public_user access to public schema
        user.in_database(as: :public_db_user) do |public_db|
          expectations_public_user.each do |query, result|
            result_obtained = public_db[query].first.values.uniq[0]
            raise "Check failed: #{query} != #{result} (#{result_obtained})" if result_obtained != result
          end
        end
      end

      def check_user_permissions(user)
        expectations_user = {
          "select has_schema_privilege('#{user.database_username}', 'public', 'USAGE');" => true,
          "select has_schema_privilege('#{user.database_username}', 'cartodb', 'USAGE');" => true,
          "select pg_function_is_visible('postgis_full_version()'::regprocedure);" => true
        }
        # Check for public_user access to public schema
        user.in_database do |public_db|
          expectations_user.each do |query, result|
            result_obtained = public_db[query].first.values.uniq[0]
            raise "Check failed: #{query} != #{result} (#{result_obtained})" if result_obtained != result
          end
          puts "Consistency tests passed!"
        end
      end
    end
  end
end

