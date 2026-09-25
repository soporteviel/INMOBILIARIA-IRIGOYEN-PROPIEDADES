import type { Metadata } from "next";
import { HomeView } from "@/components/HomeView";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: site.name,
  robots: { index: false, follow: false },
};

export default function HomeOptionTwo() {
  return <HomeView variant="solid" />;
}
