import { DateTime } from 'luxon';

function dateFilter(date, format) {
  if (date instanceof DateTime) {
    return date.toFormat(format);
  } else if (date instanceof Date) {
    return DateTime.fromJSDate(date, {
      zone: "utc",
      locale: "en"
    }).toFormat(format);
  } else {
    return DateTime.fromISO(date, {
      zone: "utc",
      locale: "en"
    }).toFormat(format);
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter("date", dateFilter);

  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "includes",
      data: "data",
      output: "dist",
    },
  };
}
