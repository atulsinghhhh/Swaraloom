import { Announcement, FieldDemo, Features, FinalCta, Footer, Hero, Nav, Numbers, Pipeline, Pricing, Triptych } from "@/components/landing";

export default function Home() {
  return (
    <>
      <Announcement />
      <Nav />
      <main>
        <Hero />
        <FieldDemo />
        <Triptych />
        <Features />
        <Numbers />
        <Pipeline />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
