export const ensure = (cond, Err, msg) => {
  if (!cond) throw new Err(msg);
};

export function categoriaNulleable(categoria_id) {
  if (categoria_id == null) return null;
  if (typeof categoria_id === "string") return categoria_id;
}
