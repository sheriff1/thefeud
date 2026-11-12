declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Injected by vite.config.ts `define` / env (error monitoring, #27).
interface ImportMetaEnv {
  readonly VITE_APP_RELEASE?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_SENTRY_DSN?: string;
}
