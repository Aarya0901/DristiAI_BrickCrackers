import { describe, expect, it } from "vitest";
import { metrics, getMetric } from "../src/content/metrics";
import { formatMetricValue } from "../src/lib/metric-format";

describe("metric honesty (brief §6)", () => {
  it("every unmeasured or target metric has value: null", () => {
    for (const m of metrics) {
      if (m.status !== "measured") {
        expect(m.value).toBeNull();
      }
    }
  });

  it("unmeasured metrics format as 'Validation in progress' with no digits", () => {
    const unmeasured = metrics.filter((m) => m.status === "unmeasured");
    expect(unmeasured.length).toBeGreaterThan(0);
    for (const m of unmeasured) {
      const out = formatMetricValue(m);
      expect(out).toBe("Validation in progress");
      expect(out).not.toMatch(/\d/);
    }
  });

  it("target metrics format as the target label, not a measured number", () => {
    const target = metrics.find((m) => m.status === "target");
    expect(target).toBeDefined();
    expect(formatMetricValue(target!)).toContain(target!.status === "target" ? target!.targetLabel : "");
  });

  it("measured metrics format value + unit", () => {
    const m = getMetric("alert-latency");
    expect(m.status).toBe("target");
    // construct a synthetic measured metric through the same formatter
    const out = formatMetricValue({ ...m, status: "measured", value: 4.2 });
    expect(out).toBe("4.2 s");
  });

  it("getMetric throws on unknown ids (no silent fallback to fake numbers)", () => {
    expect(() => getMetric("does-not-exist")).toThrow();
  });
});
