import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — PacketScope" },
      { name: "description", content: "Sign in to your PacketScope network forensics dashboard." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  return (
    <div className="min-h-screen bg-void text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Sign In</h1>
          <p className="text-silver mt-2">Enter your credentials to access PacketScope.</p>
        </div>

        <form
          className="space-y-4 rounded-xl border border-graphite bg-obsidian p-6 shadow-xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-sm text-silver">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              className="input mt-2 w-full bg-black/40 border border-graphite"
            />
          </label>

          <label className="block text-sm text-silver">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              className="input mt-2 w-full bg-black/40 border border-graphite"
            />
          </label>

          <Link to="/app/overview" className="btn btn-primary w-full py-3 inline-flex justify-center">Sign In</Link>

          <div className="text-center text-sm text-silver">
            New to PacketScope?{' '}
            <Link to="/signup" className="text-lime hover:text-white">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
