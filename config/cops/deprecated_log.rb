# encoding: utf-8
# frozen_string_literal: true

module RuboCop
  module Cop
    module CartoDB
      # This cop checks for uses of the deprecated class method usages.
      class DeprecatedLogMethods < Cop
        MSG = '`%s` is deprecated. Use CartoDB::Logger.'.freeze
        DEPRECATED_METHODS_OBJECT = [:notify_exception,
                                     :notify_error,
                                     :report_exception,
                                     :notify_debug,
                                     :notify_warning_exception].freeze

        def on_send(node)
          check(node) do |data|
            add_offense(node, :selector,
                        format(MSG, data))
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            check(node) do |data|
              corrector.replace(node.loc.selector,
                                data.replacement_method.to_s)
            end
          end
        end

        private

        def check(node)
          _, method_name, *_args = *node
          DEPRECATED_METHODS_OBJECT.each do |data|
            next unless method_name == data
            yield data
          end
        end
      end
    end
  end
end
