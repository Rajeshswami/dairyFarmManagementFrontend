export const getFarmToday = () => {
  const timeZone = "Asia/Kolkata";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

export const getFarmYear = () => {
  const today = getFarmToday();
  return Number(today.slice(0, 4));
};

export const getFarmMonth = () => {
  const today = getFarmToday();
  return Number(today.slice(5, 7));
};