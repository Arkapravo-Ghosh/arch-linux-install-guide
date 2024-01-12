import { defineUserConfig, defaultTheme } from "vuepress";

export default defineUserConfig({
  lang: "en-US",
  title: "Arch Linux Installation Guide",
  description: "Friendly Guide for installing Arch Linux. This guide covers everything you need to do while installing Arch Linux",
  theme: defaultTheme({
    editLink: true,
    repo: "https://github.com/Arkapravo-Ghosh/arch-linux-install-guide",
    logo: "/images/logo.jpg",
    sidebarDepth: 2,
  }),
  port: 3000,
  head: [['link', { rel: 'icon', href: '/images/logo.jpg' }]],
});