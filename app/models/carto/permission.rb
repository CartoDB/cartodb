require 'active_record'

module Carto

  class Permission < ActiveRecord::Base
    DEFAULT_ACL_VALUE = []

    TYPE_USER         = 'user'
    TYPE_ORGANIZATION = 'org'

    belongs_to :owner, class_name: User

    def acl
      @acl ||= self.access_control_list.nil? ? DEFAULT_ACL_VALUE : JSON.parse(self.access_control_list, symbolize_names: true)
    end
  end

end
