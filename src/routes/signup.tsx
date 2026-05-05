import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — PacketScope" },
      { name: "description", content: "Create your PacketScope account to start monitoring your network." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  return (
    <div className="min-h-screen bg-void text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Sign Up</h1>
          <p className="text-silver mt-2">Create a new PacketScope account and get started.</p>
        </div>

        <form
          className="space-y-4 rounded-xl border border-graphite bg-obsidian p-6 shadow-xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-sm text-silver">
            <span>Name</span>
            <input
              type="text"
              placeholder="Your name"
              className="input mt-2 w-full bg-black/40 border border-graphite"
            />
          </label>

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

          <Link to="/app/overview" className="btn btn-primary w-full py-3 inline-flex justify-center">Create account</Link>
          <Link to="/app/overview" className="btn btn-secondary w-full py-3 !text-[13px] !font-semibold gap-2 flex items-center justify-center">
            <LogIn size={16} /> Continue with Google
          </Link>

          <div className="text-center text-sm text-silver">
            Already have an account?{' '}
            <Link to="/signin" className="text-lime hover:text-white">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
