# encoding: utf-8

module CartoDB
  class QuotaChecker
    def initialize(user)
      @user = user
    end 

    def will_be_over_table_quota?(number_of_new_tables)
      return false unless user.remaining_table_quota
      number_of_new_tables.to_i > user.remaining_table_quota.to_i
    end

    def over_table_quota?
      return false unless user.remaining_table_quota
      user.tables.count > user.table_quota.to_i
    end

    private

    attr_reader :user
  end # QuotaChecker
end # CartoDB

