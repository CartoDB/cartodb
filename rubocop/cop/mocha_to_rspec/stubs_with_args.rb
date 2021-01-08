module RuboCop
  module Cop
    module MochaToRSpec
      class StubsWithArgs < Cop
        # TODO: Use seperate messages for allow/expect.
        MSG = "Use `allow/expect(object).to receive(...).with(...)` (rspec-mocks) instead of `object.stubs/expects(...).with(...)` (Mocha)".freeze
        def_node_matcher :candidate?, <<-CODE
  (send (send (send _ {:stubs :expects} _) :with ...) :returns _)
CODE

        def on_send(node)
          candidate?(node) do
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            obj_stubs_x_with_y, returns, ret_val = *node
            obj_stubs_x, _with, *args = *obj_stubs_x_with_y
            subject, variant, method_name = *obj_stubs_x
            args_list = args.map(&:source).join(", ")

            allow_or_expect = case variant
                              when :stubs
                                "allow"
                              when :expects
                                "expect"
                              else
                                raise "Got #{variant}"
                              end

            replacement = "#{allow_or_expect}(#{subject.source}).to receive(#{method_name.source}).with(#{args_list}).and_return(#{ret_val.source})"
            corrector.replace(node.source_range, replacement)
          end
        end
      end
    end
  end
end
