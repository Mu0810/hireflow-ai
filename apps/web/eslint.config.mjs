import next from "eslint-config-next/core-web-vitals";

// ESLint 9 flat config. Next 16 removed the `next lint` command, so linting
// runs ESLint directly against the project.
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...next,
  {
    rules: {
      // New rule in React 19's hooks plugin. It flags a common, valid guard
      // pattern (setting error state in an effect when a required param/token
      // is missing). Keep it as a warning rather than rewriting working flows.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
