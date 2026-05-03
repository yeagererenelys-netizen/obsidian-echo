import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { VideoBackground } from "@/components/ps/VideoBackground";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4 relative overflow-hidden">
      <VideoBackground src="/videos/brand/BRAND_04_anim_web.mp4" opacity={0.6} />
      <div className="relative z-10 max-w-md text-center">
        <h1 className="display text-[120px] leading-none text-lime text-glow-lime">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-white">SIGNAL LOST</h2>
        <p className="mt-2 text-sm text-ghost mono">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn btn-primary !text-[15px] !py-3 !px-8">
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
