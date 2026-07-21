export const deploymentModes = [
  {
    id: "on-premise",
    index: "01",
    title: "On-premise",
    tagline: "Inside the examination centre.",
    points: [
      "Workstation or local GPU",
      "Raw footage remains inside the centre",
      "Event metadata feeds the dashboard",
    ],
  },
  {
    id: "private-network",
    index: "02",
    title: "Private network",
    tagline: "Across the institution.",
    points: [
      "Per-camera workers",
      "Local event bus",
      "Central review dashboard",
      "No public video upload",
    ],
  },
  {
    id: "offline",
    index: "03",
    title: "Offline",
    tagline: "On one machine.",
    points: [
      "File or USB input",
      "Local inference",
      "Local evidence storage",
      "Suitable for demos and sensitive environments",
    ],
  },
];

export const eventDataFlow = [
  { stage: "Camera", detail: "RTSP/USB ingest, stays on the hall machine" },
  { stage: "Inference", detail: "Frames processed in memory, discarded" },
  { stage: "Events", detail: "Structured metadata + optional skeleton clip" },
  { stage: "Review", detail: "Dashboard over local network, role-based" },
  { stage: "Retention", detail: "Configurable window, then deletion" },
];

export const failureModes = [
  {
    id: "camera-drop",
    title: "Camera feed drops",
    response:
      "Session banner flags degraded input; affected seats move to unobservable rather than freezing on stale state.",
  },
  {
    id: "gpu-saturation",
    title: "GPU/CPU saturation",
    response:
      "Frame sampler reduces target FPS gracefully rather than silently falling behind; health panel surfaces the drop.",
  },
  {
    id: "occlusion-burst",
    title: "Sudden mass occlusion (e.g. invigilator walking through)",
    response:
      "Affected seats quarantine briefly; tracks reassign on re-acquisition without inventing continuity.",
  },
  {
    id: "storage-full",
    title: "Local storage nears capacity",
    response:
      "Oldest event clips age out first under the configured retention window; metadata and alerts are never silently dropped.",
  },
];

export const cameraHealthChecks = [
  "Frame arrival rate vs. expected FPS",
  "Detection confidence distribution (sudden collapse flags a lens/lighting issue)",
  "Per-seat visibility tier drift across a session",
  "Clock sync between camera timestamp and system time",
];

export const retentionDefaults = [
  { label: "Raw video", value: "Not persisted by default" },
  { label: "Event clips", value: "Configurable window, skeleton-first" },
  { label: "Metadata & alerts", value: "Configurable, longer than clips by default" },
  { label: "Deletion", value: "Manual and scheduled deletion supported" },
];
