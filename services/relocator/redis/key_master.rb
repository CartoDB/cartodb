# encoding: utf-8
module CartoDB
  module Relocator
    module Redis
      class KeyMaster
        def api_credential(token)
          "rails:oauth_access_tokens:#{token}"
        end #api_credential

        def database_metadata(database_name)
          "rails:#{database_name}"
        end #database_metadata

        def table_metadata(database_name, table_name)
          "rails:#{database_name}:#{table_name}"
        end #table_metadata

        def user_metadata(username)
          "rails:users:#{username}"
        end #user_metadata

        def threshold(user_id )
          "rails:users:#{user_id}:queries"
        end #thresold
      end # KeyMaster
    end # Redis
  end # Relocator
end # CartoDB

