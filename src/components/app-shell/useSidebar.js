"use client";

import { useSyncExternalStore } from "react";

import { SIDEBAR_STORAGE_KEY } from "@/lib/constants";

// Folding the large-screen sidebar.
// The state is the data-sidebar="collapsed" attribute on <html>. The "sidebar-collapsed:" classes
// (globals.css) follow it, and app/layout.jsx sets it before the page appears, so a folded sidebar
// never opens and then jumps shut. This browser remembers the choice.

const sidebarListeners = new Set();

function isSidebarCollapsed() {
  return document.documentElement.dataset.sidebar === "collapsed";
}

export function toggleSidebar() {
  const collapse = !isSidebarCollapsed();
  if (collapse) document.documentElement.dataset.sidebar = "collapsed";
  else delete document.documentElement.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapse ? "collapsed" : "open");
  } catch {
    // Private browsing: the sidebar still folds, it just isn't remembered.
  }
  sidebarListeners.forEach((listener) => listener());
}

function subscribeToSidebar(listener) {
  sidebarListeners.add(listener);
  return () => sidebarListeners.delete(listener);
}

// true while the sidebar is folded. (While the page is still being prepared on the server: false.)
export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribeToSidebar, isSidebarCollapsed, () => false);
}
