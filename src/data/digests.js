import Fetch from "@11ty/eleventy-fetch";
import { DateTime } from "luxon";
import Parser from "rss-parser";
import sanitizeHtml from "sanitize-html";
import * as fs from "fs";
import * as path from "path";

const __dirname = import.meta.dirname;

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "content"],
      ["description", "description"],
      ["category", "categories", { keepArray: true }],
    ],
  },
});

function sanitize(content) {
  return sanitizeHtml(content, {
    allowedTags: ["b", "i", "em", "strong"],
  });
}

const maxContentLength = 500;

function summarize(content) {
  if (content.length <= maxContentLength) {
    return content;
  }

  const lastSpace = content.substr(0, maxContentLength).lastIndexOf(" ");
  return content.substr(0, lastSpace) + "...";
}

export default async function () {
  let feeds;
  try {
    feeds = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../feeds.json"), "utf8"),
    );
  } catch (error) {
    console.error(`Failed to read feeds.json: ${error.message}`);
    return [];
  }

  const breakpoint = DateTime.now().minus({ months: 1 }).setZone("UTC");

  const articles = [];
  for (const feed of feeds) {
    try {
      console.log(`Fetching feed: ${feed}`);
      const parsedFeed = await parser.parseString(
        await Fetch(feed, { duration: "1h", type: "xml" }),
      );

      const items = parsedFeed.items.filter(
        (item) =>
          DateTime.fromRFC2822(item.pubDate).setZone("UTC") > breakpoint,
      );

      for (const item of items) {
        articles.push({
          feed: {
            link: parsedFeed.link,
            title: parsedFeed.title,
          },
          title: item.title,
          url: item.link,
          author: item.creator || item.author || parsedFeed.title,
          date: DateTime.fromRFC2822(item.pubDate).setZone("UTC"),
          description: sanitize(
            summarize(item.description || item.content || ""),
          ),
          categories: item.categories,
        });
      }
    } catch (error) {
      console.error(`Error fetching feed ${feed.name}: ${error.message}`);
    }
  }

  // Sort articles by publication date (newest first)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group articles by date
  const groupedByDate = {};
  articles.forEach((article) => {
    const date = article.date.toFormat("yyyy-MM-dd");
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(article);
  });

  // Convert into array of objects {date: "...", articles: [...]}
  const digests = Object.entries(groupedByDate).map(([date, articles]) => ({
    date: DateTime.fromISO(date, { zone: "UTC" }),
    articles: articles,
  }));

  return digests;
}
