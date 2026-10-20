import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 *
 * Automatically resets scroll position to the top of the page on every route transition.
 * Ensures that when navigating from one page (e.g., Dashboard scrolled to the bottom)
 * to another (e.g., Assignments, Assessment, Skills, etc.), the new page always starts
 * at the top (scrollTop = 0).
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Prevent the browser's default scroll restoration from retaining previous scroll positions
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const resetScroll = () => {
      // 1. Reset standard window/viewport scroll position
      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }

      // 2. Reset document root and body scroll
      if (typeof document !== "undefined") {
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }

        // 3. Reset main content container if it has independent scrolling context
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.scrollTop = 0;
        }

        const appLayout = document.querySelector(".app-layout");
        if (appLayout) {
          appLayout.scrollTop = 0;
        }
      }
    };

    // Immediate scroll reset on route change
    resetScroll();

    // Re-verify on the next animation frame to ensure newly mounted DOM components start at top
    const frameId = requestAnimationFrame(resetScroll);

    return () => cancelAnimationFrame(frameId);
  }, [pathname, search]);

  return null;
}
