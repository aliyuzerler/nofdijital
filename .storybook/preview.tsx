import type { Preview } from "@storybook/react-vite";
import { IconSprite } from "../src/components/site/icons";
import "../src/app/globals.css";
import "../src/app/nof.css";

/**
 * Global story dekorasyonu:
 * - Site CSS'i (nof.css) dark varsayılan; data-theme="light" anahtarıyla açık tema
 * - Site bileşenleri tam genişlikte düz zemin üzerinde gösterilir
 */
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "fullscreen",
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "dark";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
      return (
        <div data-theme={theme}>
          {/* SVG ikon sprite'ı (i-sun, i-wa, i-arr…) story ortamına da yüklenir */}
          <IconSprite />
          <Story />
        </div>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: "DEV-001 tema anahtarı (data-theme)",
      defaultValue: "dark",
      toolbar: {
        title: "Tema",
        icon: "mirror",
        items: [
          { value: "dark", title: "Koyu" },
          { value: "light", title: "Açık" },
        ],
      },
    },
  },
};

export default preview;
