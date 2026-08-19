import jollof from "@/assets/jollof.jpg";
import waakye from "@/assets/waakye.jpg";
import banku from "@/assets/banku.jpg";
import fufu from "@/assets/fufu.jpg";
import burger from "@/assets/burger.jpg";
import chickenburger from "@/assets/chickenburger.jpg";
import pizza from "@/assets/pizza.jpg";
import noodles from "@/assets/noodles.jpg";
import friedrice from "@/assets/friedrice.jpg";
import drinks from "@/assets/drinks.jpg";
import wings from "@/assets/wings.jpg";

export const CATEGORIES = [
  "Ghanaian",
  "Burgers",
  "Pizza",
  "Chinese",
  "Drinks",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Price in Ghanaian Cedis */
  price: number;
  category: Category;
  image: string;
  featured?: boolean;
};

/**
 * Static menu source. When the backend is added, replace this module's
 * export with a fetch from the database — the UI consumes `MenuItem[]` only.
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    id: "gh-jollof-chicken",
    name: "Jollof Rice & Grilled Chicken",
    description:
      "Smoky party jollof cooked in rich tomato stew, served with grilled chicken and fried plantain.",
    price: 65,
    category: "Ghanaian",
    image: jollof,
    featured: true,
  },
  {
    id: "gh-waakye-special",
    name: "Waakye Special",
    description:
      "Rice and beans with shito, spaghetti, boiled egg, gari and fried fish. The full Kasoa experience.",
    price: 55,
    category: "Ghanaian",
    image: waakye,
    featured: true,
  },
  {
    id: "gh-banku-tilapia",
    name: "Banku & Grilled Tilapia",
    description:
      "Soft banku with a whole grilled tilapia and fresh pepper-onion sauce on the side.",
    price: 90,
    category: "Ghanaian",
    image: banku,
    featured: true,
  },
  {
    id: "gh-fufu-light-soup",
    name: "Fufu & Goat Light Soup",
    description:
      "Hand-pounded fufu in peppery light soup loaded with tender goat meat.",
    price: 75,
    category: "Ghanaian",
    image: fufu,
  },
  {
    id: "gh-fried-rice-chicken",
    name: "Ghana Fried Rice & Chicken",
    description:
      "Vegetable fried rice with a quarter grilled chicken, coleslaw and house shito.",
    price: 60,
    category: "Ghanaian",
    image: friedrice,
  },
  {
    id: "gh-wings",
    name: "Peppered Chicken Wings",
    description:
      "Six wings glazed in our sweet-hot pepper sauce. Great for sharing on campus.",
    price: 45,
    category: "Ghanaian",
    image: wings,
  },
  {
    id: "bg-kin-classic",
    name: "KIN Classic Beef Burger",
    description:
      "Double beef patty, melted cheddar, lettuce, red onion and our signature burger sauce.",
    price: 70,
    category: "Burgers",
    image: burger,
    featured: true,
  },
  {
    id: "bg-crispy-chicken",
    name: "Crispy Chicken Burger",
    description:
      "Buttermilk-fried chicken thigh with slaw and spicy mayo in a toasted brioche bun.",
    price: 65,
    category: "Burgers",
    image: chickenburger,
  },
  {
    id: "bg-shito-burger",
    name: "Shito Smash Burger",
    description:
      "Smashed beef patty with caramelised onions and a bold shito aioli. Local heat, global style.",
    price: 75,
    category: "Burgers",
    image: burger,
  },
  {
    id: "bg-student-combo",
    name: "Student Burger Combo",
    description:
      "Single beef burger, fries and a chilled soft drink. Made for tight budgets and big appetites.",
    price: 55,
    category: "Burgers",
    image: chickenburger,
  },
  {
    id: "pz-pepperoni",
    name: "Classic Pepperoni Pizza",
    description:
      "Stone-baked 12\" base, mozzarella and generous pepperoni on slow-cooked tomato sauce.",
    price: 120,
    category: "Pizza",
    image: pizza,
    featured: true,
  },
  {
    id: "pz-suya-chicken",
    name: "Suya Chicken Pizza",
    description:
      "Spiced suya chicken, red onion, green pepper and mozzarella. A KIN Kitchen favourite.",
    price: 135,
    category: "Pizza",
    image: pizza,
  },
  {
    id: "pz-margherita",
    name: "Margherita",
    description:
      "Simple and perfect: tomato, mozzarella and fresh basil on a chewy hand-stretched crust.",
    price: 100,
    category: "Pizza",
    image: pizza,
  },
  {
    id: "pz-family-meat",
    name: "Family Meat Feast",
    description:
      "16\" sharing pizza with beef, chicken, sausage and peppers. Feeds three to four.",
    price: 185,
    category: "Pizza",
    image: pizza,
  },
  {
    id: "cn-chow-mein",
    name: "Chicken Chow Mein",
    description:
      "Wok-tossed noodles with chicken, crunchy vegetables and a savoury soy-garlic sauce.",
    price: 70,
    category: "Chinese",
    image: noodles,
    featured: true,
  },
  {
    id: "cn-special-fried-rice",
    name: "Special Fried Rice",
    description:
      "Shrimp, chicken and egg fried rice finished with spring onion and sesame oil.",
    price: 85,
    category: "Chinese",
    image: friedrice,
  },
  {
    id: "cn-sweet-sour-chicken",
    name: "Sweet & Sour Chicken",
    description:
      "Crispy chicken in tangy sweet-and-sour sauce with pineapple and peppers, served with rice.",
    price: 80,
    category: "Chinese",
    image: noodles,
  },
  {
    id: "cn-veg-noodles",
    name: "Vegetable Stir-Fry Noodles",
    description:
      "Egg noodles with garlic, ginger and seasonal vegetables. Light, fresh and meat-free.",
    price: 55,
    category: "Chinese",
    image: noodles,
  },
  {
    id: "dr-sobolo",
    name: "Chilled Sobolo (500ml)",
    description:
      "House-brewed hibiscus drink with ginger, pineapple and cloves. Served ice cold.",
    price: 15,
    category: "Drinks",
    image: drinks,
  },
  {
    id: "dr-fresh-juice",
    name: "Fresh Fruit Juice",
    description:
      "Blended pineapple, orange and watermelon juice with no added sugar.",
    price: 20,
    category: "Drinks",
    image: drinks,
  },
  {
    id: "dr-soft-drink",
    name: "Assorted Soft Drinks",
    description: "Chilled Coke, Fanta, Sprite or Malt — your pick, always cold.",
    price: 10,
    category: "Drinks",
    image: drinks,
  },
  {
    id: "dr-water",
    name: "Bottled Water (750ml)",
    description: "Purified table water to keep the pepper under control.",
    price: 5,
    category: "Drinks",
    image: drinks,
  },
];

export const FEATURED_ITEMS = MENU_ITEMS.filter((item) => item.featured);

export function formatCedis(amount: number) {
  return `GH\u20B5 ${amount.toFixed(2)}`;
}
