# encoding: utf-8

require 'carto/storage'

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user, class_name: Carto::User
    belongs_to :organization, class_name: Carto::Organization

    def destroy
      if organization_id
        Storage.instance.for(location, preferred_type: storage_type)
               .remove(identifier)
      end

      super
    end
  end
end
