# Palettra

Palettra turns a single color into a complete, Tailwind-ready design system:
OKLCH color ramps, typography choices, real UI previews with WCAG grades, and
token exports. This document is the project glossary — the words the code, the
UI, and our conversations all agree to use.

## Language

### Feedback channel

**Feedback channel**:
The one-way path from a visitor to the operator's mailbox. It carries every
kind of unsolicited message a visitor sends, not just praise or complaints.

**Feedback submission**:
A single message sent through the feedback channel. It has a type, a message,
and optionally the submitter's email.
_Avoid_: Ticket, report, request, contact form entry

**Feedback type**:
Which of three kinds a submission is: `general`, `feature`, or `bug`. Note the
first is `general` and never `feedback` — "feedback" names the whole channel,
so reusing it for one of its three values would make the word mean two things.
The user-facing label for `general` is still "Feedback".

**Submitter**:
The visitor who sends a feedback submission. May be signed in or anonymous, and
may choose not to give an email at all.
_Avoid_: Reporter, requester, sender

**Operator**:
The person who reads the mailbox that feedback submissions are delivered to.
Distinct from the transport account that authenticates the send.
_Avoid_: Admin, owner, support

### Color system

**Role**:
A named slot in a generated design system — Primary, Neutral, Success — that a
color is assigned to. Roles are what the user arranges; ramps are what Palettra
derives from them.
_Avoid_: Swatch group, category

**Ramp**:
The 50–950 scale of shades derived from one role's color.
_Avoid_: Scale, shades, gradient

**Palette**:
A complete set of roles plus their typography choices, addressable by URL and
saveable to a collection.

**Collection**:
The set of palettes a signed-in user has saved.
_Avoid_: Library, saved list, workspace
