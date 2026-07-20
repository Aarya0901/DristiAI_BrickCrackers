export const failureModes = [
  {
    id: "camera-drop",
    title: "Camera feed drops",
    response: "Session banner flags degraded input; affected seats move to unobservable rather than freezing on stale state.",
  },
  {
    id: "gpu-saturation",
    title: "GPU/CPU saturation",
    response: "Frame sampler reduces target FPS gracefully rather than silently falling behind; health panel surfaces the drop.",
  },
  {
    id: "occlusion-burst",
    title: "Sudden mass occlusion (e.g. invigilator walking through)",
    response: "Affected seats quarantine briefly; tracks reassign on re-acquisition without inventing continuity.",
  },
  {
    id: "storage-full",
    title: "Local storage nears capacity",
    response: "Oldest event clips age out first under the configured retention window; metadata and alerts are never silently dropped.",
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
