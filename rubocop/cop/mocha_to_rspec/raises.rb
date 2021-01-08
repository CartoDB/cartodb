module RuboCop
  module Cop
    module MochaToRSpec
      class Raises < Cop
        MSG = "Use `and_raise` (rspec-mocks) instead of `raises` (Mocha)".freeze

        def_node_matcher :candidate?, '$(send _ :raises $...)'

        def on_send(node)
          candidate?(node) do
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            receiver, _method_name, _args = *node

            return_value = node.children[2]&.source
            replacement = node.children[0].source
            replacement += ".and_raise(#{return_value})"
            corrector.replace(node.source_range, replacement)

          end
        end
      end
    end
  end
end
