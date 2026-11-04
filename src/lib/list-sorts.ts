// Ordenações das listas curtas (até dezenas de itens por conta). A primeira opção é a padrão e não aparece na URL.
// As comparações partem da ordem que a consulta já devolve, e o sort é estável: empates mantêm essa ordem.
export type SortChoice<T> = { value: string; label: string; compare?: (a: T, b: T) => number };

type Value = string | number | null | undefined;
const toNumber = (value: Value) => (value === null || value === undefined ? null : Number(value));
/** Sem valor fica por último nos dois sentidos: "a combinar" não é zero nem infinito. */
const by = <T>(read: (item: T) => Value, direction: 1 | -1 = 1) => (a: T, b: T) => {
  const left = toNumber(read(a)), right = toNumber(read(b));
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
  return (left - right) * direction;
};
const byText = <T>(read: (item: T) => string) => (a: T, b: T) => read(a).localeCompare(read(b), "pt-BR");
const time = (value: Date) => new Date(value).getTime();

type ProjectItem = { title: string; createdAt: Date; proposalCount: number; status: string };
export const projectSorts: SortChoice<ProjectItem>[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos", compare: by((item) => time(item.createdAt)) },
  { value: "propostas", label: "Mais propostas", compare: by((item) => item.proposalCount, -1) },
  { value: "abertos", label: "Abertos primeiro", compare: by((item) => (item.status === "ABERTO" ? 0 : 1)) },
  { value: "titulo", label: "Título", compare: byText((item) => item.title) },
];

// Hora e sob consulta não entram na comparação em R$ por projeto: não se misturam unidades (docs/specs/MVP.md).
const projectPrice = (item: { priceType: string; priceMin: string | null }) => (item.priceType === "POR_HORA" || item.priceType === "SOB_CONSULTA" ? null : item.priceMin);

type OfferItem = { offer: { title: string; active: boolean; createdAt: Date; priceType: string; priceMin: string | null; deadlineMinDays: number | null } };
export const offerSorts: SortChoice<OfferItem>[] = [
  { value: "titulo", label: "Título" },
  { value: "ativas", label: "Ativas primeiro", compare: by((item) => (item.offer.active ? 0 : 1)) },
  { value: "recentes", label: "Mais recentes", compare: by((item) => time(item.offer.createdAt), -1) },
  { value: "preco", label: "Menor preço", compare: by((item) => projectPrice(item.offer)) },
  { value: "prazo", label: "Menor prazo", compare: by((item) => item.offer.deadlineMinDays) },
];

type OpportunityItem = { createdAt: Date; desiredDays: number | null; budget: { max: string | null }; proposal: unknown };
export const opportunitySorts: SortChoice<OpportunityItem>[] = [
  { value: "convites", label: "Convites primeiro" },
  { value: "recentes", label: "Mais recentes", compare: by((item) => time(item.createdAt), -1) },
  { value: "orcamento", label: "Maior orçamento", compare: by((item) => item.budget.max, -1) },
  { value: "prazo", label: "Prazo mais curto", compare: by((item) => item.desiredDays) },
  { value: "pendentes", label: "Sem proposta primeiro", compare: by((item) => (item.proposal ? 1 : 0)) },
];

type MyProposalItem = { amount: string; days: number; createdAt: Date };
export const myProposalSorts: SortChoice<MyProposalItem>[] = [
  { value: "recentes", label: "Atualizadas há menos tempo" },
  { value: "enviadas", label: "Enviadas há menos tempo", compare: by((item) => time(item.createdAt), -1) },
  { value: "maior-valor", label: "Maior valor", compare: by((item) => item.amount, -1) },
  { value: "menor-valor", label: "Menor valor", compare: by((item) => item.amount) },
  { value: "prazo", label: "Menor prazo", compare: by((item) => item.days) },
];

type CompatibleItem = { priceType: string; priceMin: string | null; deadlineMinDays: number | null; rating: string | null; yearsExperience: number };
export const compatibleSorts: SortChoice<CompatibleItem>[] = [
  { value: "compatibilidade", label: "Mais compatíveis" },
  { value: "preco", label: "Menor preço", compare: by(projectPrice) },
  { value: "prazo", label: "Menor prazo", compare: by((item) => item.deadlineMinDays) },
  { value: "nota", label: "Melhor avaliação", compare: by((item) => item.rating, -1) },
  { value: "experiencia", label: "Maior experiência", compare: by((item) => item.yearsExperience, -1) },
];

export const reviewOrders = ["recentes", "melhores", "piores", "verificadas"] as const;
export type ReviewOrder = (typeof reviewOrders)[number];
export const reviewSorts: SortChoice<never>[] = [
  { value: "recentes", label: "Mais recentes" }, { value: "melhores", label: "Melhor nota" }, { value: "piores", label: "Pior nota" }, { value: "verificadas", label: "Verificadas primeiro" },
];

/** Valor pedido na URL, se for válido; senão a opção padrão. Devolve a lista já ordenada. */
export function applySort<T>(choices: SortChoice<T>[], requested: unknown, items: T[]) {
  const choice = choices.find((item) => item.value === requested) ?? choices[0];
  return { current: choice.value, isDefault: choice === choices[0], items: choice.compare ? [...items].sort(choice.compare) : items };
}

/** Opções prontas para os links. A padrão recebe `undefined`: a URL fica limpa. */
export function sortOptions<T>(choices: SortChoice<T>[], current: string, href: (value: string | undefined) => string) {
  return choices.map((choice, index) => ({ label: choice.label, href: href(index === 0 ? undefined : choice.value), current: choice.value === current }));
}
