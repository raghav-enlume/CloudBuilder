// Popular Font Awesome icons organized by category
export const fontAwesomeIcons = {
  common: [
    'home', 'user', 'heart', 'star', 'search', 'bell', 'envelope', 'trash',
    'edit', 'check', 'times', 'plus', 'minus', 'arrow-right', 'arrow-left',
    'info', 'question', 'warning', 'check-circle', 'times-circle',
  ],
  media: [
    'image', 'video', 'camera', 'music', 'volume-up', 'volume-down',
    'film', 'microphone', 'headphones', 'play', 'pause', 'stop',
  ],
  commerce: [
    'shopping-cart', 'shopping-bag', 'credit-card', 'money', 'dollar',
    'euro', 'pound', 'rupee', 'yen', 'bitcoin', 'paypal',
  ],
  business: [
    'briefcase', 'building', 'chart-line', 'chart-bar', 'chart-pie',
    'handshake', 'lightbulb', 'clipboard', 'file', 'folder',
  ],
  social: [
    'facebook', 'twitter', 'linkedin', 'instagram', 'github', 'youtube',
    'pinterest', 'reddit', 'telegram', 'whatsapp', 'slack',
  ],
  communication: [
    'phone', 'mobile', 'fax', 'envelope', 'comment', 'comments',
    'quote-left', 'quote-right', 'speech-bubble', 'chat',
  ],
  technology: [
    'laptop', 'desktop', 'tablet', 'keyboard', 'mouse', 'wifi',
    'server', 'database', 'cloud', 'code', 'terminal',
  ],
  navigation: [
    'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
    'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
    'bars', 'list', 'map', 'compass', 'location',
  ],
  interface: [
    'cog', 'wrench', 'hammer', 'tools', 'sliders', 'filter',
    'eye', 'eye-slash', 'lock', 'unlock', 'key', 'shield',
  ],
};

// Flattened list of all icons for easy searching
export const allFontAwesomeIcons = Object.values(fontAwesomeIcons).flat();

// Map categories for display
export const fontAwesomeCategories = Object.keys(fontAwesomeIcons);
