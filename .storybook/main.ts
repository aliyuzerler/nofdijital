import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook yapılandırması (SB 9 + nextjs-vite).
 * - Stories: yalnız src/ altındaki *.stories.tsx (sunucu bağımlılığı olmayan bileşenler)
 * - Tailwind v4: @tailwindcss/vite eklentisi viteFinal ile eklenir
 * - public/ statik dosyalar (logo, medya) story ortamına kopyalanır
 */
const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    return config;
  },
};
export default config;
