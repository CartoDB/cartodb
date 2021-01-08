module RuboCop
  module Cop
    module MochaToRSpec
      class StubsWithNoArgs < Cop
        # TODO: Use seperate messages for allow/expect.
        MSG = "Use `allow/expect(Object).to receive(...).and_return(...)` (rspec-mocks) instead of `Object.stubs/expects(...).returns(...)` (Mocha)".freeze
        def_node_matcher :candidate?, <<-CODE
  $(send
    $(send
      _
      ${:stubs :expects}
      _
    )
    :returns
    ...
  )
CODE

        def on_send(node)
          candidate?(node) do
            return false if node.source.include?("any_instance")
            add_offense(node, location: :selector)
          end
        end

        def autocorrect(node)
          lambda do |corrector|
            receiver, _with, *args = *node # ..., :with, :bar
            args_list = args.map(&:source).join(", ")
            subject, variant, method_name = *receiver # Object, :stubs, :foo

            allow_or_expect = case variant
                              when :stubs
                                "allow"
                              when :expects
                                "expect"
                              else
                                raise
                              end

            begin
              replacement = "#{allow_or_expect}(#{subject.source}).to receive(#{method_name.source}).and_return(#{args_list})"
            rescue => e
              require 'pry'; binding.pry
            end
            corrector.replace(node.source_range, replacement)
          end
        end
      end
    end
  end
end
