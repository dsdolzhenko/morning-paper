import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { DateTime } from "luxon";

function dateFilter(date, format) {
  const zone = process.env.TIMEZONE || "CET";
  if (date instanceof DateTime) {
    return date.setZone(zone).toFormat(format);
  } else if (date instanceof Date) {
    return DateTime.fromJSDate(date, {
      zone: zone,
      locale: "en",
    }).toFormat(format);
  } else {
    return DateTime.fromISO(date, {
      zone: zone,
      locale: "en",
    }).toFormat(format);
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter("date", dateFilter);

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addCollection("archive", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("digest")
      .sort((a, b) => b.date - a.date)
      .slice(1);
  });

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
