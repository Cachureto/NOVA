import {
  BatteryCharging,
  BedDouble,
  Cable,
  Footprints,
  Gamepad2,
  Headphones,
  Layers,
  Shirt,
  Smartphone,
  Watch,
} from 'lucide-react';

// Asigna un ícono según el slug/nombre, así funciona con cualquier categoría que cree el admin
const RULES = [
  [/sneak|footwear|calzado|tenis|zapat/, Footprints],
  [/apparel|ropa|camis|hood/, Shirt],
  [/audio|audif|sonido|parlant|micro/, Headphones],
  [/wearable|reloj|watch|band/, Watch],
  [/power|bater|bank/, BatteryCharging],
  [/carg|cable|charg/, Cable],
  [/consol|gam|tv|entreten|proyect/, Gamepad2],
  [/hogar|home|saban|casa/, BedDouble],
  [/acces|holder|soporte|funda/, Smartphone],
];

export function categoryIcon(category) {
  const key = `${category.slug} ${category.name}`.toLowerCase();
  return RULES.find(([re]) => re.test(key))?.[1] ?? Layers;
}
