import Fetch from "@11ty/eleventy-fetch";
import { DateTime } from "luxon";
import { parseFeed } from "@rowanmanning/feed-parser";
import sanitizeHtml from "sanitize-html";
import * as fs from "fs";
import * as path from "path";

const __dirname = import.meta.dirname;

function getFeeds() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../feeds.json"), "utf8"),
    );
  } catch (error) {
    console.error(`Failed to read feeds.json: ${error.message}`);
    return [];
  }
}

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

function getItemDate(item) {
  return item.published || item.updated;
}

export default async function () {
  const now = DateTime.now().setZone("UTC");

  // The oldest date to generate a digests for
  const startFrom = now.minus({ months: 1 }).toJSDate();

  const feeds = getFeeds();
  const articles = [];

  for (const feed of feeds) {
    try {
      console.log(`Fetching feed: ${feed}`);
      const parsedFeed = parseFeed(
        await Fetch(feed, { duration: "1h", type: "xml" }),
      );

      const items = parsedFeed.items.filter(
        (item) => getItemDate(item) >= startFrom,
      );

      for (const item of items) {
        articles.push({
          feed: {
            link: parsedFeed.url,
            title: parsedFeed.title,
          },
          title: item.title,
          url: item.url,
          date: DateTime.fromJSDate(getItemDate(item)).setZone("UTC"),
          description: sanitize(
            summarize(item.description || item.content || ""),
          ),
        });
      }
    } catch (error) {
      console.error(`Error fetching feed ${feed.name}: ${error.message}`);
    }
  }

  // Sort articles by publication date (newest first)
  articles.sort((a, b) => b.date.toJSDate() - a.date.toJSDate());

  // Group articles by date
  const groupedByDate = {};
  articles.forEach((article) => {
    // Digest includes articles published before next morning
    let date = article.date;
    if (
      article.date.hour < now.hour ||
      (article.date.hour == now.hour && article.date.minute < now.minute)
    ) {
      date = article.date.minus({ days: 1 });
    }

    const key = date.toFormat("yyyy-MM-dd");
    if (!groupedByDate[key]) {
      groupedByDate[key] = [];
    }
    groupedByDate[key].push(article);
  });

  // Convert into array of objects {date: "...", articles: [...]}
  const digests = Object.entries(groupedByDate).map(([date, articles]) => ({
    date: DateTime.fromISO(date, { zone: "UTC" }),
    articles: articles,
  }));

  return digests;
}
