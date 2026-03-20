README.md

To manage RRC signups, we host per-chapter signup forms on Jotform.

New signups on the Jotform triggers an approval workflow:

Sign-up -> 
  Approval workflow
    email to "chapter-signup@rrc.org" 
      - this is a distribution list, any on the distribution can OK (or DENY)
        the application
      Approved
       -> Webhook
       -> Email to requestor (if you don't get a welcome mail somethign is wrong)
          Email to distribution that the applicant has been approve
      Denied
        -> Move entry to another list (denied)
        -> Email to distribution


A few situations to deal with:

- This is the applicant's first signup
- This is the applicant's second (or other) signup

The Jotform completion page should say:
- Expect a response in 3 days
- If approved you should get an Approved email from Jotform.com
- And then a welcome email from rrchoir.simplelists.com (check your spam)
  
If you don't hear from us, contact: chapter@rrc.org

---

Under the hood:

Jotform's webhook support is rather primitive, so we use this CloudFlare Worker shim as middleware.

- Webhooks attempt to create a new SimpleList Contact that includes the 
  - Email
  - List
  - Firstname (First name and initial)

- The POST is sent to this relay
  - It attempts to POST to Simplelists by creating a new Contact
    - If it fails because the Contact already exists
      - It tries to add the List subscription to the existing contact.
    - 
