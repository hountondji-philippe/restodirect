import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  const randomBytes = crypto.randomBytes(16)
  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length]
  }
  return password
}

const RESTAURANT_DATA = [
  // AFRIQUE
  {
    name: "Chez Tantie Afi",
    cuisine: "Béninoise",
    city: "Cotonou",
    country: "Bénin",
    priceRange: "€",
    phone: "+229 21 00 01 01",
    description: "Cuisine traditionnelle béninoise authentique, recettes de grand-mère",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Amiwo au Poulet Fumé",
        price: 3500,
        category: "Plats Principaux",
        description: "Riz rouge cuisiné à la tomate avec poulet fumé traditionnel, accompagné de piment frais",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"
      },
      {
        name: 'Pâte de Maïs et Sauce Gombo',
        description: 'Pâte de maïs fermentée servie avec sauce gombo au poisson fumé et crevettes séchées',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', // ← NOUVELLE IMAGE
        category: 'Plats Principaux',
        isAvailable: true,
      },
      {
        name: "Akassa avec Sauce Graine",
        price: 3000,
        category: "Plats Principaux",
        description: "Pâte de maïs fermentée enveloppée dans une feuille, accompagnée de sauce graine au poisson",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600"
      },
      {
        name: "Wagassi Grillé",
        price: 2000,
        category: "Entrées",
        description: "Fromage peulh grillé avec sauce tomate pimentée et oignons caramélisés",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
      }
    ]
  },
  {
    name: "Le Thieboudienne",
    cuisine: "Sénégalaise",
    city: "Dakar",
    country: "Sénégal",
    priceRange: "€€",
    phone: "+221 33 00 02 02",
    description: "Spécialités sénégalaises, le vrai goût de la Teranga",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Thieboudienne au Thiof",
        price: 5000,
        category: "Plats Principaux",
        description: "Riz au poisson thiof avec légumes variés (manioc, carotte, chou, aubergine), sauce tomate",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"
      },
      {
        name: "Yassa Poulet",
        price: 4500,
        category: "Plats Principaux",
        description: "Poulet mariné aux oignons caramélisés, moutarde et citron, servi avec riz blanc",
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600"
      },
      {
        name: "Mafé de Boeuf",
        price: 5500,
        category: "Plats Principaux",
        description: "Viande de boeuf mijotée dans une sauce onctueuse à la pâte d'arachide avec légumes",
        image: "https://images.unsplash.com/photo-1504699977029-a69d6ac22741?w=600"
      },
      {
        name: "Bissap Frais",
        price: 1000,
        category: "Boissons",
        description: "Jus d'hibiscus glacé avec menthe fraîche et sucre de canne",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"
      }
    ]
  },
  {
    name: "Maquis Ivoirien",
    cuisine: "Ivoirienne",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    priceRange: "€",
    phone: "+225 27 00 03 03",
    description: "Ambiance maquis, grillades et spécialités ivoiriennes",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Attiéké Poisson Braisé",
        price: 4000,
        category: "Plats Principaux",
        description: "Semoule de manioc attiéké avec poisson braisé entier, oignons et piment",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
      },
      {
        name: "Alloco avec Poulet Braisé",
        price: 3500,
        category: "Plats Principaux",
        description: "Bananes plantain frites dorées avec poulet braisé épicé et sauce piment",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
      },
      {
        name: "Garba au Thon",
        price: 2500,
        category: "Plats Principaux",
        description: "Attiéké avec thon frit, oignons, tomates et piment frais",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"
      },
      {
        name: "Kedjenou de Poulet",
        price: 4500,
        category: "Plats Principaux",
        description: "Poulet mijoté à l'étouffée avec légumes et épices dans une canari",
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600"
      }
    ]
  },
  {
    name: "Restaurant Bamako",
    cuisine: "Malienne",
    city: "Bamako",
    country: "Mali",
    priceRange: "€",
    phone: "+223 20 00 04 04",
    description: "Saveurs du Mali, cuisine traditionnelle mandingue",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Tô avec Sauce Arachide",
        price: 3000,
        category: "Plats Principaux",
        description: "Pâte de mil ou sorgho avec sauce arachide au poulet ou viande",
        image: "https://images.unsplash.com/photo-1504699977029-a69d6ac22741?w=600"
      },
      {
        name: "Riz au Gras",
        price: 3500,
        category: "Plats Principaux",
        description: "Riz cuisiné avec viande, légumes et épices, plat national malien",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"
      },
      {
        name: "Capitaine Braisé",
        price: 6000,
        category: "Plats Principaux",
        description: "Poisson capitaine braisé au charbon avec sauce tomate pimentée",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
      },
      {
        name: "Djougourani",
        price: 1500,
        category: "Boissons",
        description: "Boisson traditionnelle à base de mil fermenté et sucre",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"
      }
    ]
  },
  {
    name: "Riad Marrakech",
    cuisine: "Marocaine",
    city: "Marrakech",
    country: "Maroc",
    priceRange: "€€",
    phone: "+212 52 00 05 05",
    description: "Cuisine marocaine raffinée dans un cadre traditionnel",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Couscous Royal",
        price: 6500,
        category: "Plats Principaux",
        description: "Couscous aux sept légumes avec viande d'agneau, poulet et merguez",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"
      },
      {
        name: "Tajine d'Agneau aux Pruneaux",
        price: 7000,
        category: "Plats Principaux",
        description: "Agneau mijoté avec pruneaux, amandes et épices dans un tajine traditionnel",
        image: "https://images.unsplash.com/photo-1504699977029-a69d6ac22741?w=600"
      },
      {
        name: "Pastilla au Poulet",
        price: 5500,
        category: "Entrées",
        description: "Feuilleté croustillant au poulet, amandes et cannelle, sucré-salé",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
      },
      {
        name: "Thé à la Menthe",
        price: 800,
        category: "Boissons",
        description: "Thé vert à la menthe fraîche servi traditionnellement",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"
      }
    ]
  },
  // EUROPE
  {
    name: "Trattoria da Mario",
    cuisine: "Italienne",
    city: "Rome",
    country: "Italie",
    priceRange: "€€",
    phone: "+39 06 00 06 06",
    description: "Authentique cuisine italienne, pâtes fraîches et pizzas au feu de bois",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    menu: [
      {
        name: "Pizza Margherita DOP",
        price: 5000,
        category: "Pizzas",
        description: "Tomate San Marzano, mozzarella di bufala campana, basilic frais, huile d'olive",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600"
      },
      {
        name: "Spaghetti Carbonara",
        price: 6000,
        category: "Pâtes",
        description: "Spaghetti al dente avec guanciale, œuf, pecorino romano et poivre noir",
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600"
      },
      {
        name: "Lasagne alla Bolognese",
        price: 7000,
        category: "Pâtes",
        description: "Couches de pâtes fraîches, ragù bolognais, béchamel et parmesan",
        image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=600"
      },
      {
        name: "Tiramisu Maison",
        price: 3500,
        category: "Desserts",
        description: "Biscuits imbibés de café, crème mascarpone et cacao amer",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600"
      }
    ]
  },
  {
    name: "Le Bistrot Parisien",
    cuisine: "Française",
    city: "Paris",
    country: "France",
    priceRange: "€€€",
    phone: "+33 1 00 07 07",
    description: "Cuisine française traditionnelle, ambiance bistrot authentique",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    menu: [
      {
        name: "Coq au Vin",
        price: 8500,
        category: "Plats Principaux",
        description: "Poulet mijoté au vin rouge de Bourgogne avec champignons, lardons et oignons",
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600"
      },
      {
        name: "Boeuf Bourguignon",
        price: 9000,
        category: "Plats Principaux",
        description: "Boeuf mijoté longuement dans vin rouge avec carottes, oignons et bouquet garni",
        image: "https://images.unsplash.com/photo-1504699977029-a69d6ac22741?w=600"
      },
      {
        name: "Croque-Monsieur",
        price: 4500,
        category: "Entrées",
        description: "Sandwich grillé au jambon et fromage avec béchamel gratinée",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600"
      },
      {
        name: "Crème Brûlée",
        price: 3000,
        category: "Desserts",
        description: "Crème vanille onctueuse avec caramel craquant sur le dessus",
        image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600"
      }
    ]
  },
  {
    name: "Al Sham",
    cuisine: "Libanaise",
    city: "Beyrouth",
    country: "Liban",
    priceRange: "€€",
    phone: "+961 1 00 08 08",
    description: "Mezzés libanais et grillades, saveurs du Levant",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Mezzé Libanais Complet",
        price: 8000,
        category: "Entrées",
        description: "Assortiment de houmous, taboulé, moutabal, falafel, feuilles de vigne et labneh",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600"
      },
      {
        name: "Chawarma Mixte",
        price: 6500,
        category: "Plats Principaux",
        description: "Broche de viande mixte (poulet et boeuf) avec sauce tahini et pickles",
        image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600"
      },
      {
        name: "Kebab Grillé",
        price: 7000,
        category: "Plats Principaux",
        description: "Brochettes de viande hachée épicée grillées au charbon avec riz et salade",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
      },
      {
        name: "Baklava",
        price: 2500,
        category: "Desserts",
        description: "Pâtisserie aux noix et pistaches avec sirop de miel et eau de rose",
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600"
      }
    ]
  },
  {
    name: "La Paella",
    cuisine: "Espagnole",
    city: "Valence",
    country: "Espagne",
    priceRange: "€€",
    phone: "+34 96 00 09 09",
    description: "Paella authentique et tapas espagnoles",
    image: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800",
    menu: [
      {
        name: "Paella Valenciana",
        price: 7500,
        category: "Plats Principaux",
        description: "Riz safrané avec poulet, lapin, haricots verts et gros haricots blancs",
        image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600"
      },
      {
        name: "Paella aux Fruits de Mer",
        price: 8500,
        category: "Plats Principaux",
        description: "Riz aux fruits de mer avec crevettes, moules, calamars et poisson",
        image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600"
      },
      {
        name: "Tapas Assorties",
        price: 5000,
        category: "Entrées",
        description: "Sélection de tapas : chorizo, jambon ibérique, olives, fromage manchego",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600"
      },
      {
        name: "Churros con Chocolate",
        price: 2500,
        category: "Desserts",
        description: "Beignets frits saupoudrés de sucre avec chocolat chaud épais",
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600"
      }
    ]
  },
  {
    name: "Taverne Grecque",
    cuisine: "Grecque",
    city: "Athènes",
    country: "Grèce",
    priceRange: "€€",
    phone: "+30 21 00 10 10",
    description: "Cuisine grecque traditionnelle avec vue sur l'Acropole",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Moussaka",
        price: 6500,
        category: "Plats Principaux",
        description: "Gratin d'aubergines, viande hachée, pommes de terre et béchamel gratinée",
        image: "https://images.unsplash.com/photo-1504699977029-a69d6ac22741?w=600"
      },
      {
        name: "Souvlaki de Poulet",
        price: 5500,
        category: "Plats Principaux",
        description: "Brochettes de poulet mariné grillées avec pita, tzatziki et salade grecque",
        image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600"
      },
      {
        name: "Salade Grecque",
        price: 3500,
        category: "Entrées",
        description: "Tomates, concombres, oignons, olives kalamata et feta avec huile d'olive",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600"
      },
      {
        name: "Baklava Grec",
        price: 2000,
        category: "Desserts",
        description: "Pâte feuilletée aux noix et cannelle avec sirop de miel",
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600"
      }
    ]
  },
  // ASIE
  {
    name: "Le Jardin de Chine",
    cuisine: "Chinoise",
    city: "Pékin",
    country: "Chine",
    priceRange: "€€",
    phone: "+86 10 00 11 11",
    description: "Cuisine chinoise authentique, spécialités du Sichuan et de Canton",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Canard Laqué Pékinois",
        price: 12000,
        category: "Plats Principaux",
        description: "Canard laqué entier servi avec crêpes, oignons et sauce hoisin",
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600"
      },
      {
        name: "Dim Sum Variés",
        price: 6500,
        category: "Entrées",
        description: "Assortiment de raviolis vapeur : crevettes, porc, légumes",
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600"
      },
      {
        name: "Poulet Kung Pao",
        price: 5500,
        category: "Plats Principaux",
        description: "Poulet sauté aux cacahuètes, piments séchés et légumes croquants",
        image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600"
      },
      {
        name: "Nouilles Sautées au Boeuf",
        price: 5000,
        category: "Plats Principaux",
        description: "Nouilles fraîches sautées au wok avec boeuf et légumes",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"
      }
    ]
  },
  {
    name: "Sakura Sushi",
    cuisine: "Japonaise",
    city: "Tokyo",
    country: "Japon",
    priceRange: "€€€",
    phone: "+81 3 00 12 12",
    description: "Sushi et sashimi frais, cuisine japonaise raffinée",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
    menu: [
      {
        name: "Sushi Omakase",
        price: 15000,
        category: "Sushi",
        description: "Sélection du chef : 12 pièces de sushi avec poissons du jour",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600"
      },
      {
        name: "Sashimi Mixte",
        price: 8000,
        category: "Sashimi",
        description: "Tranches de poisson cru : saumon, thon, daurade avec wasabi et gingembre",
        image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600"
      },
      {
        name: "Ramen Tonkotsu",
        price: 6500,
        category: "Soupes",
        description: "Bouillon de porc crémeux avec nouilles, oeuf mollet, chashu et algues",
        image: "https://images.unsplash.com/photo-1557872943-16a6acdd4b56?w=600"
      },
      {
        name: "Tempura de Crevettes",
        price: 5500,
        category: "Entrées",
        description: "Crevettes et légumes en beignets croustillants avec sauce tentsuyu",
        image: "https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600"
      }
    ]
  },
  {
    name: "Bangkok Street Food",
    cuisine: "Thaïlandaise",
    city: "Bangkok",
    country: "Thaïlande",
    priceRange: "€€",
    phone: "+66 2 00 13 13",
    description: "Street food thaïlandaise authentique, saveurs épicées et acidulées",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    menu: [
      {
        name: "Pad Thai aux Crevettes",
        price: 5500,
        category: "Nouilles",
        description: "Nouilles de riz sautées avec crevettes, oeuf, cacahuètes et sauce tamarin",
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600"
      },
      {
        name: "Tom Yum Goong",
        price: 6000,
        category: "Soupes",
        description: "Soupe épicée aux crevettes avec citronnelle, galanga et feuilles de kaffir",
        image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600"
      },
      {
        name: "Curry Vert au Poulet",
        price: 5000,
        category: "Curry",
        description: "Curry vert thaï avec poulet, lait de coco, aubergines et basilic thaï",
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600"
      },
      {
        name: "Mango Sticky Rice",
        price: 3000,
        category: "Desserts",
        description: "Riz gluant à la mangue fraîche avec lait de coco sucré",
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600"
      }
    ]
  },
  // AMÉRIQUE
  {
    name: "Taqueria El Sol",
    cuisine: "Mexicaine",
    city: "Mexico",
    country: "Mexique",
    priceRange: "€",
    phone: "+52 55 00 14 14",
    description: "Tacos authentiques et spécialités mexicaines traditionnelles",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    menu: [
      {
        name: "Tacos al Pastor",
        price: 4000,
        category: "Tacos",
        description: "Tortillas de maïs avec porc mariné à l'ananas, oignons et coriandre",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600"
      },
      {
        name: "Burrito de Carne Asada",
        price: 5500,
        category: "Burritos",
        description: "Grande tortilla avec boeuf grillé, riz, haricots, guacamole et salsa",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600"
      },
      {
        name: "Enchiladas Verdes",
        price: 5000,
        category: "Plats Principaux",
        description: "Tortillas farcies au poulet avec sauce verte, crème et fromage",
        image: "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=600"
      },
      {
        name: "Churros con Chocolate",
        price: 2500,
        category: "Desserts",
        description: "Beignets frits à la cannelle avec chocolat chaud mexicain",
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600"
      }
    ]
  },
  {
    name: "NYC Burger Joint",
    cuisine: "Américaine",
    city: "New York",
    country: "USA",
    priceRange: "€€",
    phone: "+1 212 00 15 15",
    description: "Burgers artisanaux et comfort food américaine",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
    menu: [
      {
        name: "Classic Cheeseburger",
        price: 6500,
        category: "Burgers",
        description: "Steak haché 200g, cheddar affiné, laitue, tomate, oignon, sauce maison",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
      },
      {
        name: "BBQ Bacon Burger",
        price: 7500,
        category: "Burgers",
        description: "Steak haché, bacon croustillant, oignons caramélisés, sauce BBQ",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600"
      },
      {
        name: "Buffalo Wings",
        price: 5000,
        category: "Entrées",
        description: "Ailes de poulet épicées sauce buffalo avec céleri et sauce ranch",
        image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600"
      },
      {
        name: "New York Cheesecake",
        price: 3500,
        category: "Desserts",
        description: "Cheesecake crémeux avec coulis de fruits rouges",
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600"
      }
    ]
  }
]

async function main() {
  console.log('Début du seeding sécurisé...')

  const adminPassword = generateSecurePassword()
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@restodirect.com' },
    update: {},
    create: {
      email: 'admin@restodirect.com',
      name: 'Super Admin',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN',
      isApproved: true,
    },
  })

  const credentials: Array<{email: string, password: string, role: string}> = []
  credentials.push({ email: 'admin@restodirect.com', password: adminPassword, role: 'SUPER_ADMIN' })

  const defaultOwnerPassword = generateSecurePassword()
  const hashedOwnerPassword = await bcrypt.hash(defaultOwnerPassword, 12)

  for (const data of RESTAURANT_DATA) {
    const ownerEmail = `owner_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@restodirect.com`

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: `Proprietaire ${data.name}`,
        password: hashedOwnerPassword,
        role: 'RESTAURATEUR',
        phone: data.phone,
        isApproved: true,
      },
    })

    credentials.push({ email: ownerEmail, password: defaultOwnerPassword, role: 'RESTAURATEUR' })

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        cuisine: data.cuisine,
        address: `Rue principale, ${data.city}`,
        city: data.city,
        country: data.country,
        phone: data.phone,
        deliveryTime: '30-45 min',
        priceRange: data.priceRange,
        isActive: true,
        ownerId: owner.id,
      },
    })

    const menuItems = data.menu.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      restaurantId: restaurant.id,
      isAvailable: true,
    }))

    await prisma.menuItem.createMany({ data: menuItems })
  }

  console.log('15 restaurants créés avec leurs plats authentiques')
  console.log('\n========================================')
  console.log('IDENTIFIANTS GÉNÉRÉS (à conserver secrètement)')
  console.log('========================================')
  credentials.forEach(c => {
    console.log(`${c.role}: ${c.email} / ${c.password}`)
  })
  console.log('========================================\n')
  console.log('IMPORTANT: Ces mots de passe ne sont affichés QU\'UNE SEULE FOIS.')
  console.log('Copiez-les maintenant et stockez-les de manière sécurisée.')
  console.log('Seeding terminé.')
}

main()
  .catch(e => { console.error('Erreur seeding:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })