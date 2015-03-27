require 'active_record'

module Carto

  DEFAULT_ACL_VALUE = []

  class Permission < ActiveRecord::Base
    belongs_to :owner, class_name: User

    def acl
      @acl ||= self.access_control_list.nil? ? DEFAULT_ACL_VALUE : JSON.parse(self.access_control_list, symbolize_names: true)
    end
  end

end
