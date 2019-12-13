require 'active_record'

module Carto
  class OauthToken < ApplicationRecord

    belongs_to :user, class_name: 'Carto::User'
    belongs_to :client_application, class_name: 'Carto::ClientApplication'

  end
end
