# encoding: utf-8

require 'active_support/core_ext'
require_relative 'db/sanitize.rb'

module Carto
  class ValidTableNameProposer
    DEFAULT_SEPARATOR = '_'.freeze
    DEFAULT_TABLE_NAME = 'untitled_table'.freeze
    MAX_RENAME_RETRIES = 10000
    NON_COLLISIONABLE_STRING_LENGTH = 61

    def propose_valid_table_name(contendent = DEFAULT_TABLE_NAME.dup, taken_names:)
      contendent = DEFAULT_TABLE_NAME.dup unless contendent.present?

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
        # We exclude the proposal either if the taken names array already have the proposal, or if the taken names
        # array contains a string with the first 62 chars equal to the proposal. With this we avoid typnames collision
        # when moving schemas
        return proposal unless names.any? { |name| name_can_have_typname_collision(name, proposal) }

        proposal = Carto::DB::Sanitize.append_with_truncate_and_sanitize(prefix, "#{separator}#{appendix}")
      end

      CartoDB::Logger.error(message: 'Physical tables: Out of rename retries', table_name: prefix)

      raise "Out of retries (#{MAX_RENAME_RETRIES}) renaming #{proposal}"
    end

    def name_can_have_typname_collision(name, proposal)
      name == proposal || name[0..NON_COLLISIONABLE_STRING_LENGTH] == proposal[0..NON_COLLISIONABLE_STRING_LENGTH]
    end
  end
end
