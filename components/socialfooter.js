"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// Create a reusable SVG icon component
const SocialIcon = ({ path, color, size = 24, url, name, darkModeColor }) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which color to use based on theme
  // Use resolvedTheme which gives the actual theme even if set to 'system'
  // Only render the correct color after mounting to prevent flash
  const iconColor = !mounted
    ? color
    : resolvedTheme === "dark" && darkModeColor
      ? darkModeColor
      : color;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow us on ${name}`}
      className="transition-transform hover:scale-110"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={iconColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} />
      </svg>
    </a>
  );
};

const SocialIconsFooter = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const socialIcons = [
    {
      name: "X",
      color: "#000000",
      darkModeColor: "#FFFFFF",
      url: "https://x.com/looniesandsense",
      path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    },
    {
      name: "Bluesky",
      color: "#0085FF",
      url: "https://bsky.app/profile/looniesandsense.com",
      path: "M5.43 1.761c2.66 1.997 5.52 6.046 6.57 8.219 1.05-2.173 3.91-6.222 6.57-8.219 1.92-1.441 5.03-2.556 5.03 0.992 0 0.708-0.406 5.952-0.644 6.803-0.828 2.959-3.846 3.714-6.53 3.257 4.692 0.799 5.886 3.444 3.308 6.089-4.896 5.024-7.036-1.26-7.585-2.871-0.101-0.295-0.148-0.433-0.149-0.316-0.001-0.117-0.048 0.021-0.148 0.316-0.549 1.61-2.689 7.895-7.585 2.871-2.578-2.645-1.384-5.29 3.308-6.089-2.684 0.457-5.702-0.298-6.53-3.257-0.238-0.851-0.644-6.095-0.644-6.803 0-3.547 3.11-2.433 5.03-0.992z",
    },
    {
      name: "Instagram",
      color: "#E4405F",
      url: "https://instagram.com/looniesandsense",
      path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
    },
    {
      name: "TikTok",
      color: "#000000",
      darkModeColor: "#FFFFFF",
      url: "https://tiktok.com/@looniesandsense",
      path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    },
    {
      name: "LinkedIn",
      color: "#0A66C2",
      url: "https://linkedin.com/in/looniesandsense",
      path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    },
  ];

  // Don't render until we're mounted to prevent flash of wrong theme
  if (!mounted) {
    return (
      <div className="flex gap-6 justify-center h-6">
        {/* Placeholder with same height */}
      </div>
    );
  }

  return (
<div className="flex flex-col items-center">
  <div className="flex gap-6 justify-center">
    {socialIcons.map((icon) => (
      <SocialIcon
        key={icon.name}
        path={icon.path}
        color={icon.color}
        darkModeColor={icon.darkModeColor}
        url={icon.url}
        name={icon.name}
        size={18}
      />
    ))}
  </div>
  <div className="mt-2 text-xs text-gray-500">
    &copy; 2025 Loonies and Sense. Read the blog <b><a href="https://looniesandsense.com">here</a></b>.
  </div>
</div>
  );
};

export default SocialIconsFooter;
