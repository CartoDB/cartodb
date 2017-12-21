# encoding: utf-8

module Carto
  module Tracking
    module Validators
      module User
        def check_user_consistent!
          unless @format.fetch_record!(:user).id == @reporter.id
            raise Carto::UnauthorizedError.new
          end
        end
      end
    end
  end
end
