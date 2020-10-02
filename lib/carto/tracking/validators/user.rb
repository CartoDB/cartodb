module Carto
  module Tracking
    module Validators
      module User

        def check_user_consistent!
          raise Carto::UnauthorizedError.new unless @format.fetch_record!(:user).id == @reporter.id
        end

      end
    end
  end
end
