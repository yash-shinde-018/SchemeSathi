/**
 * Mock Data File for SchemeSathi Landing Page
 * 
 * This file contains placeholder/dummy data for the landing page sections.
 * In Phase 2, this will be replaced with API calls to the Flask backend.
 * 
 * TODO: Replace with API calls to:
 * - GET /api/categories
 * - GET /api/schemes/featured
 * - GET /api/workflows
 * - GET /api/features
 */

/**
 * Category Data Structure
 * Used in CategoriesSection.jsx
 */
export const categories = [
  {
    id: 'education',
    name: 'Education & Scholarships',
    description: 'Scholarships, educational loans, and skill development programs',
    icon: 'bi-book',
    color: '#3F51B5',
    schemeCount: 24,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Health insurance, medical benefits, and wellness programs',
    icon: 'bi-heart-pulse',
    color: '#DC3545',
    schemeCount: 18,
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Farm subsidies, crop insurance, and agricultural support',
    icon: 'bi-flower1',
    color: '#28A745',
    schemeCount: 21,
  },
  {
    id: 'employment',
    name: 'Employment & Skills',
    description: 'Job training, placement assistance, and skill development',
    icon: 'bi-briefcase',
    color: '#17A2B8',
    schemeCount: 16,
  },
  {
    id: 'housing',
    name: 'Housing',
    description: 'Housing loans, rental assistance, and home improvement schemes',
    icon: 'bi-house',
    color: '#FFC107',
    schemeCount: 12,
  },
  {
    id: 'women',
    name: 'Women & Child Welfare',
    description: 'Programs supporting women entrepreneurs, child care, and family welfare',
    icon: 'bi-person-hearts',
    color: '#E83E8C',
    schemeCount: 19,
  },
  {
    id: 'social',
    name: 'Social Welfare',
    description: 'Pension schemes, disability support, and elder care programs',
    icon: 'bi-people',
    color: '#6C757D',
    schemeCount: 22,
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    description: 'Business loans, startup grants, and self-employment schemes',
    icon: 'bi-rocket',
    color: '#20C997',
    schemeCount: 14,
  },
  {
    id: 'seniors',
    name: 'Senior Citizens',
    description: 'Pension plans, healthcare benefits, and elderly support programs',
    icon: 'bi-person-check',
    color: '#8B7355',
    schemeCount: 11,
  },
  {
    id: 'disability',
    name: 'Disability Support',
    description: 'Financial assistance, vocational training, and accessibility programs',
    icon: 'bi-accessibility',
    color: '#6F42C1',
    schemeCount: 13,
  },
];

/**
 * Featured Schemes Data Structure
 * Used in FeaturedSchemesSection.jsx
 */
export const schemes = [
  {
    id: 'pmay-u-2',
    name: 'PMAY-U 2.0',
    agency: 'Central Government - Ministry of Housing and Urban Affairs',
    description:
      'Pradhan Mantri Awas Yojana 2.0 aims to provide affordable housing for economically weaker sections (EWS) and low-income groups (LIG). Eligible beneficiaries can get financial assistance and interest subsidies to build or purchase their own homes.',
    eligibility: [
      'Annual household income below ₹18 lakh',
      'No member should own a pucca house',
      'Applicable to urban areas only',
      'Priority given to women and SC/ST categories',
    ],
    benefits: [
      'Interest subsidy of up to ₹6.5 lakh per unit',
      'Central assistance up to ₹1 lakh for construction',
      'Credit enhancement guarantee to improve loan approvals',
    ],
    category: 'housing',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'ujjwala',
    name: 'PM Ujjwala Yojana',
    agency: 'Central Government - Ministry of Petroleum and Natural Gas',
    description:
      'A scheme to provide free LPG connections to women from economically weaker sections. The scheme has successfully distributed crores of cooking gas connections to BPL families and poor households, improving women safety and health.',
    eligibility: [
      'Female member of BPL family',
      'Age between 18-55 years (preferably)',
      'Must be a citizen of India',
      'Valid identity proof required',
    ],
    benefits: [
      'Free LPG connection worth ₹1,600+',
      'Free first refill',
      'No monthly fees or charges',
      'Improved indoor air quality and safety',
    ],
    category: 'women',
    lastUpdated: '2024-01-20',
  },
  {
    id: 'mjpjay',
    name: 'MJPJAY (Mahatma Jyotiba Phule Jan Arogya Yojana)',
    agency: 'Maharashtra State Government',
    description:
      'A cashless health scheme in Maharashtra providing hospitalization benefits to poor families and workers. Eligible families receive free treatment at government and private network hospitals for serious illnesses.',
    eligibility: [
      'Annual household income less than ₹2,10,000 (rural) or ₹2,75,000 (urban)',
      'Must be Maharashtra resident',
      'BPL card holder or identified APL families',
      'Construction workers and laborers',
    ],
    benefits: [
      'Cashless hospitalization up to ₹1 lakh per year',
      'Coverage for serious illnesses and surgeries',
      'Pre-authorization and free treatment',
      'No out-of-pocket expenses at network hospitals',
    ],
    category: 'healthcare',
    lastUpdated: '2024-01-18',
  },
  {
    id: 'aicte-swanath',
    name: 'AICTE Swanath Scholarship',
    agency: 'All India Council for Technical Education',
    description:
      'A scholarship program providing financial assistance to meritorious students from poor socio-economic backgrounds pursuing technical and higher education. Students receive tuition fee waivers and monthly stipends.',
    eligibility: [
      'Pursuing recognized diploma or degree program',
      'Family income below ₹4.5 lakh annually',
      'Minimum 60% marks in previous qualification',
      'Indian citizen',
      'Registered with recognized institution',
    ],
    benefits: [
      'Full or partial tuition fee waiver',
      'Monthly stipend of ₹3,000-₹5,000',
      'Career guidance and mentorship',
      'Placement assistance support',
    ],
    category: 'education',
    lastUpdated: '2024-01-22',
  },
];

/**
 * How It Works Steps
 * Used in HowItWorksSection.jsx
 */
export const workflows = [
  {
    id: 1,
    order: 1,
    title: 'Tell Us About Yourself',
    description:
      'Share basic information about yourself including age, income, occupation, education level, and location. This helps us understand your profile and find relevant schemes.',
    icon: 'bi-person-circle',
  },
  {
    id: 2,
    order: 2,
    title: 'Discover Relevant Schemes',
    description:
      'Our intelligent matching system analyzes your profile and shows government schemes that align with your eligibility criteria and life situation.',
    icon: 'bi-binoculars',
  },
  {
    id: 3,
    order: 3,
    title: 'Understand Eligibility & Benefits',
    description:
      'Get detailed information about each scheme including eligibility requirements, application process, benefits, and timeline. Understand how each scheme can help you.',
    icon: 'bi-info-circle',
  },
  {
    id: 4,
    order: 4,
    title: 'Apply Through Official Website',
    description:
      'When ready, apply directly through the official government website or portal. We provide direct links and guidance to the official application process.',
    icon: 'bi-box-arrow-up-right',
  },
];

/**
 * Why SchemeSathi Features
 * Used in WhySchemeSathiSection.jsx
 */
export const features = [
  {
    id: 1,
    title: 'Simple to Understand',
    description:
      'We simplify complex government schemes into easy-to-understand language. No bureaucratic jargon, just clear information about eligibility and benefits.',
    icon: 'bi-lightbulb',
    benefits: ['Clear language', 'Simple navigation', 'Easy eligibility checks'],
  },
  {
    id: 2,
    title: 'Personalized Discovery',
    description:
      'Instead of browsing hundreds of schemes, get personalized recommendations based on your unique situation including age, income, occupation, and location.',
    icon: 'bi-targeted',
    benefits: ['Smart matching', 'Relevant schemes', 'Time-saving'],
  },
  {
    id: 3,
    title: 'Official Sources',
    description:
      'All scheme information comes directly from government portals and official sources. We verify data regularly to ensure accuracy and completeness.',
    icon: 'bi-shield-check',
    benefits: ['Verified data', 'Official sources', 'Up-to-date information'],
  },
  {
    id: 4,
    title: 'Completely Free',
    description:
      'SchemeSathi is free to use with no hidden charges or premium features. Access all government schemes and discovery tools at no cost.',
    icon: 'bi-gift',
    benefits: ['No registration fees', 'No charges', 'Full access'],
  },
];

/**
 * Trust Strip Data Structure
 * Used in TrustStripSection.jsx
 */
export const trustItems = [
  {
    id: 1,
    icon: 'bi-stack',
    title: '100+ Schemes',
    description: 'Explore schemes across multiple categories.',
  },
  {
    id: 2,
    icon: 'bi-shield-check',
    title: 'Official Sources',
    description: 'Access information connected to government and official public sources.',
  },
  {
    id: 3,
    icon: 'bi-globe',
    title: 'Multiple Languages',
    description: 'Start with English, Hindi and Marathi.',
  },
  {
    id: 4,
    icon: 'bi-gift',
    title: 'Free Access',
    description: 'Discover scheme information without any charge.',
  },
];

/**
 * Explore Categories Data Structure
 * Used in ExploreCategoriesSection.jsx
 */
export const exploreCategories = [
  {
    id: 'education',
    title: '🎓 Education & Scholarships',
    description: 'Scholarships, educational assistance and student support.',
  },
  {
    id: 'healthcare',
    title: '🏥 Healthcare',
    description: 'Healthcare assistance, insurance and medical support programs.',
  },
  {
    id: 'agriculture',
    title: '🌾 Agriculture',
    description: 'Support for farmers, agriculture, livestock and rural activities.',
  },
  {
    id: 'employment',
    title: '💼 Employment & Skills',
    description: 'Employment opportunities, skill development and livelihood support.',
  },
  {
    id: 'housing',
    title: '🏠 Housing',
    description: 'Housing assistance and support for eligible households.',
  },
  {
    id: 'women',
    title: '👩 Women & Child Welfare',
    description: 'Programs supporting women, children and families.',
  },
];

/**
 * Load Mock Data by Type
 * 
 * @param {string} type - Type of data to load: 'categories', 'schemes', 'workflows', 'features', 'trustItems', 'exploreCategories', or 'all'
 * @returns {Object|Array} Requested data
 * 
 * Example:
 * const allCategories = loadMockData('categories');
 * const allData = loadMockData('all');
 */
export function loadMockData(type) {
  switch (type) {
    case 'categories':
      return categories;
    case 'schemes':
      return schemes;
    case 'workflows':
      return workflows;
    case 'features':
      return features;
    case 'trustItems':
      return trustItems;
    case 'exploreCategories':
      return exploreCategories;
    case 'all':
      return {
        categories,
        schemes,
        workflows,
        features,
        trustItems,
        exploreCategories,
      };
    default:
      console.warn(`Unknown data type: ${type}. Available types: categories, schemes, workflows, features, trustItems, exploreCategories, all`);
      return null;
  }
}

export default {
  categories,
  schemes,
  workflows,
  features,
  trustItems,
  exploreCategories,
  loadMockData,
};
