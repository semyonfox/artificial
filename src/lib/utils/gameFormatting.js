import { config } from "../../../js/core/config.js";

export function formatNumber(value = 0) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toString();
}

export function formatResourceName(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function formatId(id) {
  return formatResourceName(id);
}

export function formatEraName(key) {
  return config.eraData?.[key]?.name || formatResourceName(key);
}

let civNameLookup = null;
export function formatCivName(id) {
  if (!civNameLookup) {
    civNameLookup = new Map();
    for (const civs of Object.values(config.civSpecializations || {})) {
      civs.forEach((civ) => civNameLookup.set(civ.id, civ.name));
    }
  }
  return civNameLookup.get(id) || formatResourceName(id);
}

export function getResourceIcon(resource, fallback = resource) {
  return config.resourceIcons[resource] || fallback;
}

export function formatAmount(amount) {
  return Math.abs(amount) >= 1_000 ? formatNumber(amount) : `${amount}`;
}

export function formatCost(cost = {}) {
  return Object.entries(cost)
    .map(
      ([resource, amount]) =>
        `${formatAmount(amount)} ${getResourceIcon(resource)}`,
    )
    .join(", ");
}

export function formatNamedCost(cost = {}) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${formatAmount(amount)} ${formatResourceName(resource)}`)
    .join(', ');
}

export function getMissingCost(cost = {}, resources = {}) {
  return formatNamedCost(Object.fromEntries(Object.entries(cost)
    .filter(([resource, amount]) => (resources[resource] || 0) < amount)
    .map(([resource, amount]) => [resource, Math.ceil(amount - (resources[resource] || 0))])));
}

export function getRelevantResources(currentEra) {
  const currentIdx = config.eraOrder.indexOf(currentEra);
  if (currentIdx < 0) return new Set();

  const relevant = new Set();
  for (let i = 0; i <= currentIdx; i++) {
    for (const resource of config.resourcesByEra[config.eraOrder[i]] || []) {
      relevant.add(resource);
    }
  }
  return relevant;
}

export function getEraProgressPercent(advancementCost, resources = {}) {
  const entries = Object.entries(advancementCost || {});
  if (entries.length === 0) return 100;

  const totalFulfilled = entries.reduce((sum, [resource, required]) => {
    const current = resources[resource] || 0;
    return sum + Math.min(1, current / required);
  }, 0);

  return (totalFulfilled / entries.length) * 100;
}

export function formatAdvancementProgress(advancementCost, resources = {}) {
  const entries = Object.entries(advancementCost || {});
  if (entries.length === 0) return "Final era reached";

  return entries
    .map(
      ([resource, amount]) =>
        `${Math.floor(resources[resource] || 0)}/${amount} ${resource}`,
    )
    .join(", ");
}

export function getPurchaseButtonClasses(isPurchased, isAvailable) {
  if (isPurchased) return "bg-success/20 text-success border-success/30";
  if (isAvailable) return "btn-primary";
  return "btn-secondary";
}

export function getChoiceButtonClasses(isChosen, isLocked) {
  if (isChosen) return "bg-success/20 text-success border-success/30";
  if (isLocked) return "btn-secondary";
  return "btn-primary";
}
