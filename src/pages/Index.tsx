import LoginForm from "@/components/LoginForm";

const Index = () => {
  return (
    <main className="gradient-bg relative min-h-screen overflow-hidden">
      {/* Floating Orbs Background */}
      <div className="floating-orb floating-orb-1" aria-hidden="true" />
      <div className="floating-orb floating-orb-2" aria-hidden="true" />
      <div className="floating-orb floating-orb-3" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center py-12">
        <LoginForm />
      </div>
    </main>
  );
};

export default Index;
