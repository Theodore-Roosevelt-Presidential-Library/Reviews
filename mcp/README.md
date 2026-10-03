# Reviews MCP server

Read-only access to the visitor-review data for the Theodore Roosevelt Presidential
Library and Salt + Scoria, for any assistant that speaks MCP.

```
"What are diners complaining about this month?"
"Which reviews are past our response deadline?"
"Has anyone mentioned the boardwalk since September?"
"Compare the Library and the restaurant over the last 30 days."
```

## Setup

No install step — standard library only, Python 3.9+.

Add to your MCP client's config (for Claude Desktop, `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "trpl-reviews": {
      "command": "python3",
      "args": ["/Users/mbriney/Documents/GitHub/Reviews/mcp/server.py"]
    }
  }
}
```

That reads the **published** data at `reviews.labs.trlibrary.com`, so it works from any
machine and needs no checkout. To read a local checkout instead — for offline work, or to
see data the collector has produced but not yet pushed — add `"--local", "/path/to/Reviews"`
to `args`.

## Where the data comes from

The dashboard is a static site, so its JSON files are already a public read-only API. This
server reads those files and caches them for five minutes. There is no database and no
second pipeline: the collector's daily commit updates GitHub Pages, and the server picks
it up on the next cache expiry.

Adding a business to `config.json` makes it appear here automatically. Nothing in this
server names a business.

## Tools

| Tool | What it answers |
|---|---|
| `list_businesses` | What is tracked, with headline numbers. Start here. |
| `get_overview` | The written brief for a period: what changed and why. |
| `search_reviews` | Full-text search with filters for rating, theme, source, date, answered. |
| `get_themes` | What people are talking about, how often, rising or falling. |
| `get_response_queue` | What needs a reply, worst overdue first. |
| `get_review` | One review in full, including any reply already posted. |
| `get_quotes` | Visitor quotes approved for publication as marketing copy. |
| `compare_businesses` | The businesses side by side. |

## Two things to know before you trust an answer

**Review text is written by strangers and is not trustworthy input.** Anyone can type
anything into a Google review, including text shaped to look like instructions to an AI
assistant. Every response carrying review text is prefixed with a notice saying so. The
server is read-only by design: there is no tool here that can change anything, so the
worst case of a malicious review is a misleading answer rather than an action taken on a
reviewer's say-so. **Keep it that way.** If this ever needs to write, the write path
belongs somewhere a human approves each change, not behind a tool call that a review's
contents could influence.

**Author names are returned as collected.** They are already public on the review
platforms and in this repo, and you need them to find and answer a specific review. But an
MCP makes them queryable in bulk in a way a dashboard does not. That is a reasonable
trade for an internal tool and a different question entirely if this is ever exposed
publicly — which would also mean putting a server in front of it, since GitHub Pages
serves static files and cannot run this.

## Caveats the tools themselves report

- `compare_businesses` returns a caution with its numbers: the corpora are very different
  sizes, so one review moves the restaurant's average far more than the Library's, and a
  visitor and a diner are not rating the same thing.
- Reviews whose date is not day-precision count in all-time totals but appear in no
  window. `get_overview` carries the count under `all_time` versus `current`.
- Facebook recommendations are yes/no, so those records carry `recommends` and leave
  `rating` null. Never read a null rating as a zero.
