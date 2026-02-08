export interface Product {
  id: string;
  name: string;
  price: number;
  delivery_days: number;
  retailer: "Amazon" | "Walmart" | "Target";
  category: string;
  colors: string[];
  variants: string[];
  image_placeholder: string;
}

export const products: Product[] = [
  // ─── APPAREL ───
  { id: "amz-a1", name: "Classic Cotton T-Shirt", price: 18.99, delivery_days: 2, retailer: "Amazon", category: "apparel", colors: ["white", "black", "navy", "red"], variants: ["S", "M", "L", "XL"], image_placeholder: "👕" },
  { id: "amz-a2", name: "Slim Fit Jeans", price: 34.99, delivery_days: 3, retailer: "Amazon", category: "apparel", colors: ["blue", "black", "gray"], variants: ["30", "32", "34", "36"], image_placeholder: "👖" },
  { id: "amz-a3", name: "Zip-Up Hoodie", price: 42.99, delivery_days: 2, retailer: "Amazon", category: "apparel", colors: ["gray", "black", "navy"], variants: ["S", "M", "L", "XL"], image_placeholder: "🧥" },
  { id: "amz-a4", name: "Running Shorts", price: 22.99, delivery_days: 1, retailer: "Amazon", category: "apparel", colors: ["black", "navy", "gray"], variants: ["S", "M", "L"], image_placeholder: "🩳" },
  { id: "amz-a5", name: "Wool Blend Beanie", price: 14.99, delivery_days: 1, retailer: "Amazon", category: "apparel", colors: ["black", "gray", "red", "navy"], variants: ["One Size"], image_placeholder: "🧢" },
  { id: "wmt-a1", name: "Athletic Polo Shirt", price: 15.99, delivery_days: 3, retailer: "Walmart", category: "apparel", colors: ["white", "blue", "black"], variants: ["S", "M", "L", "XL"], image_placeholder: "👕" },
  { id: "wmt-a2", name: "Cargo Pants", price: 28.99, delivery_days: 4, retailer: "Walmart", category: "apparel", colors: ["khaki", "olive", "black"], variants: ["30", "32", "34", "36"], image_placeholder: "👖" },
  { id: "wmt-a3", name: "Pullover Sweatshirt", price: 24.99, delivery_days: 3, retailer: "Walmart", category: "apparel", colors: ["gray", "navy", "red"], variants: ["S", "M", "L", "XL"], image_placeholder: "🧥" },
  { id: "wmt-a4", name: "Denim Jacket", price: 39.99, delivery_days: 4, retailer: "Walmart", category: "apparel", colors: ["blue", "black"], variants: ["S", "M", "L", "XL"], image_placeholder: "🧥" },
  { id: "tgt-a1", name: "Organic Cotton Tee", price: 16.99, delivery_days: 3, retailer: "Target", category: "apparel", colors: ["white", "sage", "blush", "navy"], variants: ["XS", "S", "M", "L"], image_placeholder: "👕" },
  { id: "tgt-a2", name: "High-Rise Leggings", price: 29.99, delivery_days: 2, retailer: "Target", category: "apparel", colors: ["black", "gray", "navy"], variants: ["XS", "S", "M", "L"], image_placeholder: "👖" },
  { id: "tgt-a3", name: "Fleece Vest", price: 34.99, delivery_days: 3, retailer: "Target", category: "apparel", colors: ["black", "olive", "navy"], variants: ["S", "M", "L", "XL"], image_placeholder: "🧥" },
  { id: "tgt-a4", name: "Linen Button-Down", price: 32.99, delivery_days: 3, retailer: "Target", category: "apparel", colors: ["white", "blue", "tan"], variants: ["S", "M", "L", "XL"], image_placeholder: "👔" },

  // ─── SPORTS GEAR ───
  { id: "amz-s1", name: "NFL Team Jersey", price: 79.99, delivery_days: 3, retailer: "Amazon", category: "sports", colors: ["team colors"], variants: ["Patriots", "Chiefs", "Cowboys", "49ers"], image_placeholder: "🏈" },
  { id: "amz-s2", name: "Team Baseball Cap", price: 24.99, delivery_days: 2, retailer: "Amazon", category: "sports", colors: ["team colors"], variants: ["Patriots", "Yankees", "Lakers", "Bulls"], image_placeholder: "🧢" },
  { id: "amz-s3", name: "Athletic Running Shoes", price: 64.99, delivery_days: 2, retailer: "Amazon", category: "sports", colors: ["black", "white", "blue"], variants: ["8", "9", "10", "11", "12"], image_placeholder: "👟" },
  { id: "amz-s4", name: "Insulated Team Water Bottle", price: 19.99, delivery_days: 1, retailer: "Amazon", category: "sports", colors: ["team colors"], variants: ["Patriots", "Lakers", "Yankees"], image_placeholder: "🥤" },
  { id: "amz-s5", name: "Team Fan Scarf", price: 22.99, delivery_days: 2, retailer: "Amazon", category: "sports", colors: ["team colors"], variants: ["Patriots", "Chiefs", "Packers"], image_placeholder: "🧣" },
  { id: "wmt-s1", name: "Sports Team Hoodie", price: 44.99, delivery_days: 4, retailer: "Walmart", category: "sports", colors: ["team colors"], variants: ["Patriots", "Cowboys", "Chiefs", "Eagles"], image_placeholder: "🧥" },
  { id: "wmt-s2", name: "Team Logo Socks (3-Pack)", price: 12.99, delivery_days: 3, retailer: "Walmart", category: "sports", colors: ["team colors"], variants: ["Patriots", "Lakers", "Bulls"], image_placeholder: "🧦" },
  { id: "wmt-s3", name: "Basketball Shorts", price: 19.99, delivery_days: 3, retailer: "Walmart", category: "sports", colors: ["black", "red", "blue"], variants: ["S", "M", "L", "XL"], image_placeholder: "🩳" },
  { id: "wmt-s4", name: "Team Rally Towel", price: 9.99, delivery_days: 3, retailer: "Walmart", category: "sports", colors: ["team colors"], variants: ["Patriots", "Chiefs", "Steelers"], image_placeholder: "🏳️" },
  { id: "tgt-s1", name: "Team Spirit T-Shirt", price: 21.99, delivery_days: 2, retailer: "Target", category: "sports", colors: ["team colors"], variants: ["Patriots", "49ers", "Packers", "Bears"], image_placeholder: "👕" },
  { id: "tgt-s2", name: "Athletic Sneakers", price: 54.99, delivery_days: 3, retailer: "Target", category: "sports", colors: ["white", "black", "gray"], variants: ["8", "9", "10", "11"], image_placeholder: "👟" },
  { id: "tgt-s3", name: "Team Face Paint Kit", price: 8.99, delivery_days: 2, retailer: "Target", category: "sports", colors: ["multi"], variants: ["NFL", "NBA", "MLB"], image_placeholder: "🎨" },
  { id: "tgt-s4", name: "Sports Backpack", price: 34.99, delivery_days: 3, retailer: "Target", category: "sports", colors: ["black", "navy", "red"], variants: ["Standard"], image_placeholder: "🎒" },

  // ─── ELECTRONICS ───
  { id: "amz-e1", name: "Wireless Bluetooth Earbuds", price: 49.99, delivery_days: 1, retailer: "Amazon", category: "electronics", colors: ["black", "white"], variants: ["Standard", "Pro"], image_placeholder: "🎧" },
  { id: "amz-e2", name: "Portable Phone Charger 10000mAh", price: 24.99, delivery_days: 1, retailer: "Amazon", category: "electronics", colors: ["black", "white"], variants: ["10000mAh", "20000mAh"], image_placeholder: "🔋" },
  { id: "amz-e3", name: "Smart Watch Fitness Tracker", price: 89.99, delivery_days: 2, retailer: "Amazon", category: "electronics", colors: ["black", "silver", "rose gold"], variants: ["Standard", "Premium"], image_placeholder: "⌚" },
  { id: "amz-e4", name: "Bluetooth Speaker Waterproof", price: 39.99, delivery_days: 2, retailer: "Amazon", category: "electronics", colors: ["black", "blue", "red"], variants: ["Mini", "Standard"], image_placeholder: "🔊" },
  { id: "amz-e5", name: "USB-C Fast Charging Cable (3-Pack)", price: 14.99, delivery_days: 1, retailer: "Amazon", category: "electronics", colors: ["black", "white"], variants: ["3ft", "6ft"], image_placeholder: "🔌" },
  { id: "wmt-e1", name: "Over-Ear Headphones", price: 34.99, delivery_days: 3, retailer: "Walmart", category: "electronics", colors: ["black", "blue"], variants: ["Wired", "Wireless"], image_placeholder: "🎧" },
  { id: "wmt-e2", name: "LED Desk Lamp", price: 22.99, delivery_days: 4, retailer: "Walmart", category: "electronics", colors: ["white", "black"], variants: ["Standard", "With USB"], image_placeholder: "💡" },
  { id: "wmt-e3", name: "Tablet Stand Adjustable", price: 16.99, delivery_days: 3, retailer: "Walmart", category: "electronics", colors: ["silver", "black"], variants: ["Standard"], image_placeholder: "📱" },
  { id: "tgt-e1", name: "Wireless Charging Pad", price: 19.99, delivery_days: 2, retailer: "Target", category: "electronics", colors: ["white", "black"], variants: ["Standard", "Fast"], image_placeholder: "🔋" },
  { id: "tgt-e2", name: "Portable Mini Speaker", price: 29.99, delivery_days: 2, retailer: "Target", category: "electronics", colors: ["teal", "coral", "black"], variants: ["Standard"], image_placeholder: "🔊" },
  { id: "tgt-e3", name: "Screen Protector (2-Pack)", price: 9.99, delivery_days: 1, retailer: "Target", category: "electronics", colors: ["clear"], variants: ["iPhone", "Samsung", "Universal"], image_placeholder: "📱" },

  // ─── HOME GOODS ───
  { id: "amz-h1", name: "Scented Candle Set (3-Pack)", price: 24.99, delivery_days: 2, retailer: "Amazon", category: "home", colors: ["white", "amber"], variants: ["Vanilla", "Lavender", "Ocean"], image_placeholder: "🕯️" },
  { id: "amz-h2", name: "Decorative Throw Pillow", price: 19.99, delivery_days: 2, retailer: "Amazon", category: "home", colors: ["gray", "blue", "cream", "rust"], variants: ["18x18", "20x20"], image_placeholder: "🛋️" },
  { id: "amz-h3", name: "French Press Coffee Maker", price: 29.99, delivery_days: 2, retailer: "Amazon", category: "home", colors: ["black", "copper"], variants: ["12oz", "34oz"], image_placeholder: "☕" },
  { id: "amz-h4", name: "Bamboo Cutting Board Set", price: 22.99, delivery_days: 2, retailer: "Amazon", category: "home", colors: ["natural"], variants: ["3-Pack"], image_placeholder: "🪵" },
  { id: "wmt-h1", name: "Microfiber Sheet Set", price: 29.99, delivery_days: 3, retailer: "Walmart", category: "home", colors: ["white", "gray", "navy", "sage"], variants: ["Twin", "Full", "Queen", "King"], image_placeholder: "🛏️" },
  { id: "wmt-h2", name: "Stainless Steel Water Bottle", price: 14.99, delivery_days: 3, retailer: "Walmart", category: "home", colors: ["silver", "black", "blue"], variants: ["24oz", "32oz"], image_placeholder: "🥤" },
  { id: "wmt-h3", name: "Storage Basket Set (3-Pack)", price: 18.99, delivery_days: 4, retailer: "Walmart", category: "home", colors: ["gray", "white", "brown"], variants: ["Small", "Medium"], image_placeholder: "🧺" },
  { id: "tgt-h1", name: "Ceramic Vase", price: 16.99, delivery_days: 2, retailer: "Target", category: "home", colors: ["white", "terracotta", "sage"], variants: ["Small", "Medium"], image_placeholder: "🏺" },
  { id: "tgt-h2", name: "Cozy Throw Blanket", price: 24.99, delivery_days: 2, retailer: "Target", category: "home", colors: ["cream", "gray", "blush"], variants: ["50x60"], image_placeholder: "🧶" },
  { id: "tgt-h3", name: "Glass Food Storage Set (8-Piece)", price: 32.99, delivery_days: 3, retailer: "Target", category: "home", colors: ["clear"], variants: ["8-Piece"], image_placeholder: "🫙" },
  { id: "tgt-h4", name: "Woven Placemat Set (4-Pack)", price: 14.99, delivery_days: 2, retailer: "Target", category: "home", colors: ["natural", "gray", "black"], variants: ["4-Pack"], image_placeholder: "🍽️" },

  // ─── PARTY SUPPLIES ───
  { id: "amz-p1", name: "Balloon Arch Kit (100pc)", price: 19.99, delivery_days: 2, retailer: "Amazon", category: "party", colors: ["multi", "gold", "pastel"], variants: ["Birthday", "Wedding", "Generic"], image_placeholder: "🎈" },
  { id: "amz-p2", name: "Disposable Dinnerware Set (50pc)", price: 24.99, delivery_days: 2, retailer: "Amazon", category: "party", colors: ["gold", "silver", "rose gold"], variants: ["25 guests", "50 guests"], image_placeholder: "🍽️" },
  { id: "amz-p3", name: "LED String Lights 50ft", price: 15.99, delivery_days: 1, retailer: "Amazon", category: "party", colors: ["warm white", "multi", "cool white"], variants: ["50ft", "100ft"], image_placeholder: "✨" },
  { id: "amz-p4", name: "Photo Booth Props Kit (30pc)", price: 12.99, delivery_days: 2, retailer: "Amazon", category: "party", colors: ["multi"], variants: ["Birthday", "Wedding", "Graduation"], image_placeholder: "📸" },
  { id: "wmt-p1", name: "Paper Cups & Plates Set (40pc)", price: 8.99, delivery_days: 3, retailer: "Walmart", category: "party", colors: ["blue", "pink", "gold"], variants: ["20 guests"], image_placeholder: "🥤" },
  { id: "wmt-p2", name: "Birthday Banner & Bunting", price: 6.99, delivery_days: 3, retailer: "Walmart", category: "party", colors: ["multi", "gold", "pink"], variants: ["Happy Birthday", "Congrats"], image_placeholder: "🎉" },
  { id: "wmt-p3", name: "Tablecloth 3-Pack", price: 9.99, delivery_days: 3, retailer: "Walmart", category: "party", colors: ["white", "black", "red", "blue"], variants: ["54x108"], image_placeholder: "🎪" },
  { id: "wmt-p4", name: "Party Favor Bags (50pc)", price: 7.99, delivery_days: 3, retailer: "Walmart", category: "party", colors: ["multi", "pastel", "neon"], variants: ["50pc"], image_placeholder: "🎁" },
  { id: "tgt-p1", name: "Confetti Pack (Gold & Silver)", price: 5.99, delivery_days: 2, retailer: "Target", category: "party", colors: ["gold", "silver", "rose gold"], variants: ["1 Pack"], image_placeholder: "🎊" },
  { id: "tgt-p2", name: "Party Napkins 100ct", price: 6.99, delivery_days: 2, retailer: "Target", category: "party", colors: ["white", "pastel", "bright"], variants: ["100ct"], image_placeholder: "🧻" },
  { id: "tgt-p3", name: "Cake Topper Decoration", price: 8.99, delivery_days: 2, retailer: "Target", category: "party", colors: ["gold", "silver"], variants: ["Happy Birthday", "Celebrate", "Custom Age"], image_placeholder: "🎂" },
  { id: "tgt-p4", name: "Helium Balloon Kit (20pc)", price: 14.99, delivery_days: 2, retailer: "Target", category: "party", colors: ["pastel", "bright", "metallic"], variants: ["20pc"], image_placeholder: "🎈" },

  // ─── ACCESSORIES ───
  { id: "amz-x1", name: "Leather Wallet", price: 29.99, delivery_days: 2, retailer: "Amazon", category: "accessories", colors: ["brown", "black", "tan"], variants: ["Bifold", "Trifold"], image_placeholder: "👛" },
  { id: "amz-x2", name: "Polarized Sunglasses", price: 24.99, delivery_days: 2, retailer: "Amazon", category: "accessories", colors: ["black", "tortoise", "clear"], variants: ["Standard"], image_placeholder: "🕶️" },
  { id: "amz-x3", name: "Canvas Tote Bag", price: 18.99, delivery_days: 2, retailer: "Amazon", category: "accessories", colors: ["natural", "black", "navy"], variants: ["Standard"], image_placeholder: "👜" },
  { id: "amz-x4", name: "Leather Belt", price: 19.99, delivery_days: 2, retailer: "Amazon", category: "accessories", colors: ["brown", "black"], variants: ["S", "M", "L", "XL"], image_placeholder: "🪢" },
  { id: "wmt-x1", name: "Digital Watch", price: 19.99, delivery_days: 3, retailer: "Walmart", category: "accessories", colors: ["black", "silver"], variants: ["Standard"], image_placeholder: "⌚" },
  { id: "wmt-x2", name: "Knit Scarf", price: 12.99, delivery_days: 3, retailer: "Walmart", category: "accessories", colors: ["gray", "navy", "red", "cream"], variants: ["Standard"], image_placeholder: "🧣" },
  { id: "wmt-x3", name: "Crossbody Bag", price: 22.99, delivery_days: 4, retailer: "Walmart", category: "accessories", colors: ["black", "tan", "olive"], variants: ["Small", "Medium"], image_placeholder: "👜" },
  { id: "tgt-x1", name: "Beaded Bracelet Set", price: 12.99, delivery_days: 2, retailer: "Target", category: "accessories", colors: ["multi", "earth tones", "metallics"], variants: ["Set of 3"], image_placeholder: "📿" },
  { id: "tgt-x2", name: "Hair Accessories Set", price: 9.99, delivery_days: 2, retailer: "Target", category: "accessories", colors: ["multi", "neutrals", "pastels"], variants: ["12-Pack"], image_placeholder: "🎀" },
  { id: "tgt-x3", name: "Travel Toiletry Bag", price: 16.99, delivery_days: 2, retailer: "Target", category: "accessories", colors: ["black", "floral", "navy"], variants: ["Standard"], image_placeholder: "🧳" },
  { id: "tgt-x4", name: "Minimalist Card Holder", price: 14.99, delivery_days: 2, retailer: "Target", category: "accessories", colors: ["black", "tan", "blush"], variants: ["Standard"], image_placeholder: "💳" },
];

export const getProductsByRetailer = (retailer: Product["retailer"]) =>
  products.filter((p) => p.retailer === retailer);

export const getProductsByCategory = (category: string) =>
  products.filter((p) => p.category === category);

export const getProductById = (id: string) =>
  products.find((p) => p.id === id);

export const categories = ["apparel", "sports", "electronics", "home", "party", "accessories"] as const;
export const retailers = ["Amazon", "Walmart", "Target"] as const;
