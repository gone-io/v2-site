// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Gone 文档',
  tagline: 'Gone是一个Go 语言的轻量级的依赖注入框架，goner是基于Gone框架的组件库。',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://goner.fun',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'gone-io', // Usually your GitHub org/user name.
  projectName: 'gone', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh',
    locales: [
      'zh',
      // 'en',
    ],
    // localeConfigs: {
    //   en: {
    //     htmlLang: 'en-GB',
    //   },
    //   zh: {
    //   },
    // },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/gone-io/v2-site/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/gone-io/v2-site/tree/main/blog/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({



      tableOfContents: {
        minHeadingLevel: 2, // 最小标题层级（默认 H2）
        maxHeadingLevel: 4, // 最大展示到 H4 标题
      },

      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Gone 文档',
        logo: {
          alt: 'Gone Logo',
          src: 'img/logo.png',
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'quickstart',
          //   position: 'left',
          //   label: '快速开始',
          // },
          {
            to: '/docs/devguide/part1/quickstart',
            position: 'left',
            label: '快速入门',
          },
          {
            type: 'docSidebar',
            sidebarId: 'devguide',
            position: 'left',
            label: '开发指南',
          },
          {
            to: '/blog',
            label: '博客',
            position: 'left',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/gone-io/gone',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        // links: [
        //   {
        //     title: '文档',
        //     items: [
        //       {
        //         label: '开放指南',
        //         to: '/docs/tutorial',
        //       },
        //     ],
        //   },
        //   {
        //     title: 'Community',
        //     items: [
        //       {
        //         label: 'Stack Overflow',
        //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        //       }
        //     ],
        //   },
        //   {
        //     title: 'More',
        //     items: [
        //       {
        //         label: '博客',
        //         to: '/blog',
        //       },
        //       {
        //         label: '组件库',
        //         href: 'https://github.com/gone-io/goner',
        //       },
        //     ],
        //   },
        // ],
        copyright: `Copyright © ${new Date().getFullYear()} Gone Docs, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
