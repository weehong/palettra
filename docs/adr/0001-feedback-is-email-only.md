# Feedback is delivered as email only — no auto-reply, no persistence

The feedback channel accepts submissions from anonymous visitors and sends them
to exactly one destination: the operator's mailbox, over SMTP. Submissions are
not written to Firestore, and the submitter never receives an automatic
acknowledgement — the dialog confirms receipt on screen, and the operator
replies by hand later if the submitter left an email.

The reason is that the endpoint is unauthenticated. Any design where the
endpoint can send mail to an address chosen by the caller is an open relay: an
attacker supplies the recipient and the body, and our sending reputation pays
for it. Keeping the recipient list fixed at one operator-configured address is
what makes the honeypot and rate limit sufficient rather than merely hopeful.
This is why there is no "we've received your feedback" auto-reply, and why
adding one is not the small courtesy it looks like.

## Consequences

- A transient SMTP failure loses the submission. The dialog therefore surfaces
  failures loudly and keeps the submitter's typed text intact for retry; it must
  never report success it did not get.
- The operator's mailbox is the only record. There is no admin view, no
  submission history, and no way to answer "how many feature requests came in
  last month" from the application.
- Persistence can be added later without revisiting this decision. Adding an
  auto-reply cannot — it reintroduces the caller-chosen recipient this ADR
  exists to forbid.
