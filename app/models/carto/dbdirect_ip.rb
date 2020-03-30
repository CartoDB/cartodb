module Carto
  class DbdirectIp< ActiveRecord::Base
    belongs_to :user, inverse_of: :dbdirect_ip, foreign_key: :user_id
    # TODO: validate ips
  end
end
