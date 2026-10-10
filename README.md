# OpenInfinity Website

[中文](#中文) · [English](#english)

## 中文

OpenInfinity 官网（<https://www.open-infinity.com>）的源码。目前是"敬请期待"页：标志、一句产品介绍（"你需要的 Mac 工具，你想象的 AI 智能体，优雅地合而为一。"）、随机标语（每次访问都不同，点击可换一句）、实时流动的渐变背景，以及到[设计资源](https://design.open-infinity.com)的链接。支持中英切换。

- 框架：[Astro](https://astro.build)，输出纯静态页面，由 GitHub Actions 部署到 GitHub Pages。
- 背景：WebGL 着色器（`src/scripts/gradient.js`），在 12 组配色预设（`src/data/palettes.js`）之间循环过渡；系统开启"减少动态效果"时显示静态画面。
- 标语：`src/data/taglines.js`，中英成对，直接增删即可。

```sh
npm install
npm run dev      # 本地预览
npm run build    # 输出到 dist/
```

背景配色预设取自 [feralui.dev/gradients](https://feralui.dev/gradients) 的 Flow 预设。标志与字体的使用规则见 [OpenInfinity/design](https://github.com/OpenInfinity/design)。

## English

Source for the OpenInfinity website (<https://www.open-infinity.com>). For now it is a coming-soon page: the logo, a one-line introduction ("Every Mac tool you need, every AI agent you imagine — elegantly, in one app."), a random tagline (different on every visit, click for another), a live flowing gradient and a link to the [design resources](https://design.open-infinity.com). Chinese and English.

- Framework: [Astro](https://astro.build), static output deployed to GitHub Pages by GitHub Actions.
- Background: a WebGL shader (`src/scripts/gradient.js`) cycling through twelve palette presets (`src/data/palettes.js`); a still frame is shown when reduced motion is on.
- Taglines: `src/data/taglines.js`, Chinese and English pairs — add or remove freely.

```sh
npm install
npm run dev      # local preview
npm run build    # output in dist/
```

The background palettes are the Flow presets from [feralui.dev/gradients](https://feralui.dev/gradients). Logo and font rules live in [OpenInfinity/design](https://github.com/OpenInfinity/design).

## License

Code is under the [MIT License](LICENSE). The OpenInfinity name and logo are trademarks — see [TRADEMARK.md](https://github.com/OpenInfinity/design/blob/main/TRADEMARK.md). Geist is under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`).
