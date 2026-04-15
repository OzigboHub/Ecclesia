"use client";

import { useEffect } from "react";

/**
 * Hides the global PublicNavbar when the docs layout is mounted
 * by adding a data attribute to the body element.
 */
export function HidePublicNavbar() {
  useEffect(() => {
    document.body.setAttribute("data-docs-layout", "true");
    return () => {
      document.body.removeAttribute("data-docs-layout");
    };
  }, []);

  return null;
}
