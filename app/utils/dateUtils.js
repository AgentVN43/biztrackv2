// utils/dateUtils.js
const {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  isValid,
  format,
} = require("date-fns");

const processDateFilters = (query) => {
  let effectiveStartDate = null;
  let effectiveEndDate = null;

  if (query.year) {
    const year = parseInt(query.year);
    if (!isNaN(year)) {
      effectiveStartDate = format(
        startOfYear(new Date(year, 0, 1)),
        "yyyy-MM-dd"
      );
      effectiveEndDate = format(endOfYear(new Date(year, 0, 1)), "yyyy-MM-dd");
    }
  }

  if (query.month && query.year) {
    const year = parseInt(query.year);
    const month = parseInt(query.month) - 1; // Tháng trong JS là 0-11
    if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
      effectiveStartDate = format(
        startOfMonth(new Date(year, month, 1)),
        "yyyy-MM-dd"
      );
      effectiveEndDate = format(
        endOfMonth(new Date(year, month, 1)),
        "yyyy-MM-dd"
      );
    }
  }

  if (query.day && query.month && query.year) {
    const year = parseInt(query.year);
    const month = parseInt(query.month) - 1;
    const day = parseInt(query.day);
    const date = new Date(year, month, day);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && isValid(date)) {
      const formattedDate = format(date, "yyyy-MM-dd");
      effectiveStartDate = formattedDate;
      effectiveEndDate = formattedDate;
    }
  }

  if (query.startDate) {
    try {
      const parsedStartDate = parseISO(query.startDate);
      if (isValid(parsedStartDate)) {
        effectiveStartDate = format(parsedStartDate, "yyyy-MM-dd");
      }
    } catch (error) {
      console.warn("Lỗi khi parse startDate:", error);
    }
  }

  if (query.endDate) {
    try {
      const parsedEndDate = parseISO(query.endDate);
      if (isValid(parsedEndDate)) {
        effectiveEndDate = format(parsedEndDate, "yyyy-MM-dd");
      }
    } catch (error) {
      console.warn("Lỗi khi parse endDate:", error);
    }
  }

  return { effectiveStartDate, effectiveEndDate };
};

const getMonthsOfYear = (locale = "vi") => {
  const now = new Date();
  const startOfYearDate = startOfYear(now);
  const endOfYearDate = endOfYear(now);
  return eachMonthOfInterval({
    start: startOfYearDate,
    end: endOfYearDate,
  }).map((date) => format(date, "MMMM", { locale }));
};

const getDaysOfYear = (year = new Date().getFullYear()) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return eachDayOfInterval({ start: startDate, end: endDate }).map((date) =>
    format(date, "yyyy-MM-dd")
  );
};

module.exports = { processDateFilters, getMonthsOfYear, getDaysOfYear };
