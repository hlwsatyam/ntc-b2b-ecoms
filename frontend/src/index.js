import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Global image URL fixer
const fixImageUrls = (root = document) => {
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");

    if (!src) return;

    // Already valid
    if (
      src.startsWith("http") 
    ) {
      return;
    }

    img.setAttribute("src", `${process.env.REACT_APP_BACKEND_URL}${src}`);
  });
};

// Observe React DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;

      if (node.tagName === "IMG") {
        const src = node.getAttribute("src");

        if (
          src &&
          !src.startsWith("http") 
        ) {
          node.setAttribute("src", `${process.env.REACT_APP_BACKEND_URL}${src}`);
        }
      }

      fixImageUrls(node);
    });
  });
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Initial images
document.addEventListener("DOMContentLoaded", () => {
  fixImageUrls();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);