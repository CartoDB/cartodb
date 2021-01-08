module RuboCop
  module Cop
    module MochaToRSpec
      class Stub < Cop
        MSG = "Use `double` (rspec-mocks) instead of `stub` (Mocha)".freeze

        # def_node_matcher :candidate?, '$(send _ :returns $_)'

        def on_send(node)
          _receiver, method_name, _args = *node
          return unless method_name == :stub

          add_offense(node)
        end

        def autocorrect(node)
          lambda do |corrector|
            corrector.replace(node.loc.selector, "double")
          end
        end
      end
    end
  end
end
