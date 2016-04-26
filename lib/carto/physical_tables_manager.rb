# encoding utf-8

require_relative 'db/sanitize.rb'

module Carto
  class PhysicalTablesManager
    DEFAULT_SEPARATOR = '_'.freeze
    MAX_RENAME_RETRIES = 99999

    def initialize(user_id)
      @user = ::User.where(id: user_id).first
    end

    def propose_valid_name_table_name(contendent)
      sanitized_contendent = Carto::DB::Sanitize.sanitize_identifier(contendent)
      physical_table_names = fetch_physical_table_names

      find_unsed_name_with_prefix(physical_table_names, sanitized_contendent)
    end

    private

    def find_unsed_name_with_prefix(names, prefix, separator: DEFAULT_SEPARATOR)
      proposal = prefix

      [1..MAX_RENAME_RETRIES].each do |appendix|
        return proposal unless names.include?(proposal)

        proposal = Carto::DB::Sanitize.append_with_truncate_and_sanitize(prefix, "#{separator}#{appendix}")
      end

      Carto::Logger.error(message: 'Physical tables: Out of rename retries',
                          user: @user,
                          table_name: prefix)
    end

    def fetch_physical_table_names
      sql = %{
        SELECT tablename AS name
        FROM pg_tables
        WHERE schemaname = '#{@user.database_schema}' AND
              tableowner = '#{@user.database_username}'
      }

      results = @user.in_database[sql].all

      results.map { |result| result[:name] }
    end
  end
end
