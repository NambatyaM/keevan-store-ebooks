import { calculateSaleSplit } from "@/lib/constants";

export const demoCreator = {
  id: "creator-001",
  name: "Amina Nakasero",
  handle: "aminanak",
  bio: "Ugandan author helping first-time founders build profitable digital businesses.",
  city: "Kampala, Uganda",
  storeUrl: "/store/aminanak",
  avatar: "AN",
  active: true
};

export const demoProducts = [
  {
    id: "product-001",
    slug: "write-and-sell-your-first-ebook",
    title: "Write and Sell Your First E-book",
    creator: demoCreator.name,
    creatorHandle: demoCreator.handle,
    price: 25000,
    format: "PDF + EPUB",
    pages: 118,
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    description:
      "A practical guide for East African creators who want to turn expertise into a focused digital product and launch it with confidence.",
    bullets: ["Launch checklist", "Pricing worksheet", "Promotion templates", "Buyer delivery guide"],
    views: 4280,
    purchases: 316,
    downloads: 309,
    revenue: 7900000
  },
  {
    id: "product-002",
    slug: "the-kampala-creator-playbook",
    title: "The Kampala Creator Playbook",
    creator: demoCreator.name,
    creatorHandle: demoCreator.handle,
    price: 18000,
    format: "PDF",
    pages: 84,
    cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
    description:
      "A simple operating manual for creators building an audience, selling directly, and tracking revenue without complicated tools.",
    bullets: ["Audience map", "Sales page prompts", "Weekly metrics", "Creator finance basics"],
    views: 3015,
    purchases: 201,
    downloads: 198,
    revenue: 3618000
  }
];

export const creatorMetrics = {
  totalEarnings: 11518000,
  availableBalance: 624000,
  totalProducts: 2,
  totalOrders: 517,
  storeViews: 9241,
  productViews: 7295,
  conversionRate: 7.1,
  downloads: 507,
  pendingWithdrawals: 150000,
  completedWithdrawals: 10744000
};

export const adminMetrics = {
  totalCreators: 286,
  totalRevenue: 182400000,
  totalSales: 9218,
  platformEarnings: 18240000,
  withdrawalRequests: 14,
  activeStores: 241,
  suspendedStores: 7,
  newRegistrations: 39
};

export const salesTrend = [
  { label: "Mon", sales: 18, earnings: 386000 },
  { label: "Tue", sales: 24, earnings: 528000 },
  { label: "Wed", sales: 16, earnings: 344000 },
  { label: "Thu", sales: 31, earnings: 719000 },
  { label: "Fri", sales: 42, earnings: 966000 },
  { label: "Sat", sales: 38, earnings: 856000 },
  { label: "Sun", sales: 29, earnings: 642000 }
];

export const withdrawalRequests = [
  { id: "WD-1028", creator: "Amina Nakasero", amount: 150000, status: "Pending", method: "Mobile Money", date: "2026-06-24" },
  { id: "WD-1027", creator: "Peter Okello", amount: 420000, status: "Approved", method: "Bank Transfer", date: "2026-06-23" },
  { id: "WD-1026", creator: "Nadia Achieng", amount: 95000, status: "Paid", method: "Mobile Money", date: "2026-06-21" }
];

export const splitExample = calculateSaleSplit(10000);
