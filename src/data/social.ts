export type SocialPlatformId = 'linkedin' | 'instagram' | 'youtube';

export interface SocialLinkItem {
  id: SocialPlatformId;
  label: 'LinkedIn' | 'Instagram' | 'YouTube';
  ctaLabel: string;
  handle: string;
  href: string;
}

export const SOCIAL_URLS = {
  linkedin: 'https://www.linkedin.com/in/muhammad-talha-24053b337/',
  instagram: 'https://www.instagram.com/talha_malik143_',
  youtube: 'https://www.youtube.com/@Quran_Translators',
} as const;

export const SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    ctaLabel: 'Connect on LinkedIn',
    handle: 'Muhammad Talha',
    href: SOCIAL_URLS.linkedin,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    ctaLabel: 'Follow on Instagram',
    handle: '@talha_malik143_',
    href: SOCIAL_URLS.instagram,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    ctaLabel: 'Watch on YouTube',
    handle: '@Quran_Translators',
    href: SOCIAL_URLS.youtube,
  },
];
