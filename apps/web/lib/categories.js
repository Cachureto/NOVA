import { BatteryCharging, BedDouble, Cable, Gamepad2, Headphones, Layers, Smartphone } from 'lucide-react';

// Asigna un ícono según el slug/nombre, así funciona con cualquier categoría que cree el admin
const RULES = [
  [/audio|audif|sonido|parlant|micro/, Headphones],
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
