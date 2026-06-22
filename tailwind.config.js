/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F4EFE8",
        "ink-dim": "#B7B0A4",
        "ink-faint": "#7A746B",
        void: "#0B0B0C",
        "void-deep": "#060607",
        "void-raised": "#121214",
        ruby: "#E1006B",
        "ruby-dim": "#7A1C49",
        line: "rgba(244,239,232,0.09)",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest2: "0.32em",
      },
    },
  },
  plugins: [],
};
