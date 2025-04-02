# Morning paper

Daily digest of RSS feeds as static website

## How It Works

1. The script fetches articles from RSS feeds defined in `feeds.json`
2. Articles are grouped by publication date
3. Eleventy generates daily digest pages with summaries
4. GitHub Actions deploys the site to GitHub Pages automatically once per day

## Setup Instructions

### 1. Clone this repository

```bash
git clone https://github.com/dsdolzhenko/morning-paper.git
cd morning-paper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your RSS feeds

Edit the `feed.json` file to add your favourite RSS feeds:

```json
[
  "https://example.com/feed.xml"
]
```

### 4. Test locally

```bash
npm run serve
```

This will start a local server at `http://localhost:8080`.

### 5. Deploy to GitHub

1. Push the repository to GitHub
2. Go to the repository settings and enable GitHub Pages for the `gh-pages` branch
3. GitHub Actions will automatically build and deploy your site daily

## License

The project is licensed under [the MIT license](LICENSE.txt).
