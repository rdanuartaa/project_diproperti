export const formatThousands = (rawValue) => {
  const digits = String(rawValue ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatCompact = (amount) => {
  const value = Number(amount);
  if (!value) return "0";
  const formatUnit = (num) => {
    const rounded = Math.round(num * 10) / 10;
    const text = rounded % 1 === 0 ? String(rounded).replace(/\.0$/, "") : String(rounded);
    return text.replace(".", ",");
  };
  if (value >= 1_000_000_000) return `${formatUnit(value / 1_000_000_000)} milyar`;
  if (value >= 1_000_000) return `${formatUnit(value / 1_000_000)} juta`;
  if (value >= 1_000) return `${formatUnit(value / 1_000)} ribu`;
  return String(value);
};

export const formatViewCount = (amount) => {
  const value = Number(amount);
  if (!value) return "0";
  const formatUnit = (num) => {
    const rounded = Math.round(num * 10) / 10;
    const text = rounded % 1 === 0 ? String(rounded).replace(/\.0$/, "") : String(rounded);
    return text.replace(".", ",");
  };
  if (value >= 1_000_000_000) return `${formatUnit(value / 1_000_000_000)} m`;
  if (value >= 1_000_000) return `${formatUnit(value / 1_000_000)}jt`;
  if (value >= 1_000) return `${formatUnit(value / 1_000)}k`;
  return String(value);
};

export const formatFullRupiah = (amount) => `Rp ${formatThousands(amount)}`;

export const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};
