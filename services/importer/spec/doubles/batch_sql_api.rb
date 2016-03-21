require 'json'

# encoding: utf-8
module CartoDB
  module Importer2
    module Doubles
      class BatchSQLApi
        attr_accessor :api_key, :username

        def initialize(user, db)
          @user = user
          @db = db
        end

        def execute(query)
          @db.run(query)
          fake_response(query)
        end

        def status(id)
          fake_response(query, 'completed')
        end

        def check_status(id)
          fake_response(query, 'completed')
        end

        private

        def fake_response(query, status='running')
          escaped_query = query.gsub(/\"/, '\\"')
          body = %Q[{"job_id": "93a7f9b9-2660-4542-a5a6-1f2931eb9549", "user": "#{@user.username}", "status": "#{status}", "query": "#{escaped_query}", "created_at": "2016-03-19T17:38:12.434Z", "updated_at": "2016-03-19T17:38:12.451Z"}]
          ::JSON.parse(body)
        end
      end
    end
  end
end
