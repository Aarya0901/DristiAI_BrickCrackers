import type { Metadata } from "next";
import { Hero } from "../components/hero/Hero";
import { CapabilityMarquee } from "../components/sections/CapabilityMarquee";
import { HowItWorks } from "../components/sections/HowItWorks";
import { CapabilityCatalog } from "../components/sections/CapabilityCatalog";
import { TwoSurfaces } from "../components/sections/TwoSurfaces";
import { SmallFeatureGrid } from "../components/sections/SmallFeatureGrid";
import { Evaluation } from "../components/sections/Evaluation";
import { Trust } from "../components/sections/Trust";
import { BuildStages } from "../components/sections/BuildStages";
import { Faq } from "../components/sections/Faq";
import { FinalCta } from "../components/sections/FinalCta";

export const metadata: Metadata = {
  title: "VIGIL — Explainable AI for Physical Examination Halls",
  description:
    "Identity-free examination-hall behaviour intelligence using anonymous seat tracking, room-level attention estimation, relational evidence, and human-reviewed alerts.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CapabilityMarquee />
      <HowItWorks />
      <CapabilityCatalog />
      <TwoSurfaces />
      <SmallFeatureGrid />
      <Evaluation />
      <Trust />
      <BuildStages />
      <Faq />
      <FinalCta />
    </>
  );
}
