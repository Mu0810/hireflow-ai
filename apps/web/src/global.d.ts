// Ambient declarations for non-code side-effect imports.
// TypeScript 6 is stricter about side-effect imports (e.g. `import "./globals.css"`)
// and requires a module declaration for them.
declare module "*.css";
declare module "*.scss";
