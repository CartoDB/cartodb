require 'active_record'

module Carto
  class OauthToken < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    belongs_to :client_application, class_name: Carto::ClientApplication

  end
end
