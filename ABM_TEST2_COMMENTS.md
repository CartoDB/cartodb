# Second Carto Test

First of all I've checked Gemfile to check ruby version used but no ruby attribute there, I found it on installation guides. I've installed it on my RVM and installed missed stuff on configutation guide.

I have created a new user for a development environment using the sh and after it I have created an organization for this user using the rake task (create_new_organization_with_owner).

#### First bug. Signup invitation fails when the user has more than one active invitation

First of all I have searched the error string on the issue image "Fake token sent for" in all code.
This has sent me to user_creation.rb (def select_valid_invitation_token(invitations)) and I have added a byebug there.

Then, I've reproduced the issue on my dev environment. I noted:

* I can't see pending invitations on organization users view, may be it'd be a good feature.

* Creates 2 equal invitations on db. No sense...

I use to apply TDD on bugs to avoid it will repeated in the future and also it uses to help to fix the bug.
In this case I created a test on user_creation_spec.rb creating 2 invitations (removed when final solution applied) and debugging it,
i've discovered a Carto::UserCreation after_create callback (:use_invitation).
This method adds the email to used_emails array on the invitation record and this makes it disappear from :query_with_unused_email Invitation's "scope" used in:

`def pertinent_invitation
     @pertinent_invitation ||= select_valid_invitation_token(Carto::Invitation.query_with_unused_email(email).all)
 end`

Then the RuntimeError Exception: Fake token sent for email... is raised.
 
How should I fix it?

We can change the invitation's "scope", we can think on the UserCreation's callback.... but I think the root issue is to allow duplicated invitations.
So, I proposed and told it to the team to discuss about it, to add a uniqueness validation por invitations emails by organization...
After this talk, I've implemented "remove old" invitation solution. 
I created 2 tests on invitations model to check it. These fail and I implemented the needed quick code to make them pass.

