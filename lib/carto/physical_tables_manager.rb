# encoding utf-8

require_relative 'db/sanitize.rb'

module Carto
  class PhysicalTablesManager
    DEFAULT_SEPARATOR = '_'.freeze
    DEFAULT_TABLE_NAME = 'untitled_table'.freeze
    MAX_RENAME_RETRIES = 10000

    def initialize(user_id)
      @user = ::User.where(id: user_id).first
    end

    def propose_valid_table_name(contendent: DEFAULT_TABLE_NAME.dup, taken_names: fetch_physical_table_names)
      contendent = DEFAULT_TABLE_NAME.dup unless contendent && !contendent.empty?
      taken_names = fetch_physical_table_names unless taken_names

      sanitized_contendent = Carto::DB::Sanitize.sanitize_identifier(contendent)
      used_table_names = taken_names +
                         Carto::DB::Sanitize::SYSTEM_TABLE_NAMES +
                         Carto::DB::Sanitize::RESERVED_TABLE_NAMES

      find_unused_name_with_prefix(used_table_names, sanitized_contendent)
    end

    private

    def find_unused_name_with_prefix(names, prefix, separator: DEFAULT_SEPARATOR)
      proposal = prefix

      (1..MAX_RENAME_RETRIES).each do |appendix|
        return proposal unless names.include?(proposal)

        proposal = Carto::DB::Sanitize.append_with_truncate_and_sanitize(prefix, "#{separator}#{appendix}")
      end

      CartoDB::Logger.error(message: 'Physical tables: Out of rename retries',
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
