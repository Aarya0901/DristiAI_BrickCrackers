export const privacyPrinciples = [
  {
    id: "no-facial-recognition",
    title: "No facial recognition",
    body: "VIGIL does not run facial recognition and does not build or query a face database. There is no step in the pipeline that could link a frame to an identity.",
  },
  {
    id: "anonymous-seat-ids",
    title: "Anonymous seat IDs",
    body: "Every tracked person is represented only as a seat ID (e.g. C7), valid for the duration of a session and discarded with it. Seat IDs never persist across sessions.",
  },
  {
    id: "transient-inference",
    title: "Transient inference",
    body: "Raw frames live only in a short in-memory buffer used to produce the current signals. They are not written to disk by default in any deployment mode.",
  },
  {
    id: "skeleton-replay",
    title: "Skeleton-first replay",
    body: "Evidence replay defaults to pose-skeleton animation, not raw video. A deployment can opt in to short RGB clips for review, but skeleton-first is the default everywhere.",
  },
  {
    id: "event-only-retention",
    title: "Event-only retention",
    body: "What persists is structured event metadata and, if enabled, short event clips — never a continuous recording of the session.",
  },
  {
    id: "role-based-access",
    title: "Role-based access",
    body: "Review, dismissal, export, and configuration are separated by role, so a chief invigilator's view and a control-room operator's view expose only what that role needs.",
  },
  {
    id: "deletion",
    title: "Configurable deletion",
    body: "Retention windows are configurable per data type, with manual and scheduled deletion — institutions set the window, not a fixed vendor default.",
  },
  {
    id: "audit-trail",
    title: "Audit trail",
    body: "Every accept, dismiss, note, and configuration change is logged with a timestamp and role, independent of the alert data itself.",
  },
  {
    id: "human-review",
    title: "Human review before any conclusion",
    body: "No output of VIGIL is a conclusion. Every alert is a behavioural review request; interpretation is a human process the system does not participate in.",
  },
  {
    id: "accommodation-controls",
    title: "Accommodation controls",
    body: "Seats can be flagged for accommodation-related exceptions (e.g. a student who is permitted a support device) so legitimate behaviour is never treated as anomalous.",
  },
];

export const dpdpAlignment = [
  "Purpose limitation — data collected is scoped to behavioural review, not general surveillance.",
  "Data minimisation — anonymous seat IDs and event metadata instead of identity and continuous recording.",
  "Storage limitation — configurable, finite retention windows instead of indefinite storage.",
  "Consent and notice — institutions are expected to notify students that a behaviour-review system is in use.",
];

export const dpdpDisclaimer =
  "VIGIL is designed for DPDP-aligned deployment and claims no DPDP certification — no such certification exists. Final compliance posture is set by each institution's own deployment, notice, and retention configuration.";
