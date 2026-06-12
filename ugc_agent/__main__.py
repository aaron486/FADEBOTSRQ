"""CLI entry point.

Usage:
    python -m ugc_agent collect [--no-analyze] [--config config.yaml] [--db ugc.db]
    python -m ugc_agent report  [--limit 25] [--relevant-only]
    python -m ugc_agent export  [--out ugc_export.json] [--limit 200] [--relevant-only]
"""

from __future__ import annotations

import argparse
import logging
import sys

from .agent import load_config, run
from .storage import Storage


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ugc_agent",
                                     description="Viral UGC collection agent")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--db", default="ugc.db")
    parser.add_argument("-v", "--verbose", action="store_true")
    sub = parser.add_subparsers(dest="command", required=True)

    collect = sub.add_parser("collect", help="Run one collection cycle")
    collect.add_argument("--no-analyze", action="store_true",
                         help="Skip the Claude analysis step")

    report = sub.add_parser("report", help="Print top posts to stdout")
    report.add_argument("--limit", type=int, default=25)
    report.add_argument("--relevant-only", action="store_true")

    export = sub.add_parser("export", help="Export top posts to JSON")
    export.add_argument("--out", default="ugc_export.json")
    export.add_argument("--limit", type=int, default=200)
    export.add_argument("--relevant-only", action="store_true")

    args = parser.parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    storage = Storage(args.db)
    try:
        if args.command == "collect":
            config = load_config(args.config)
            stats = run(config, storage, analyze=not args.no_analyze)
            print(f"collected={stats['collected']} new={stats['new']} "
                  f"analyzed={stats['analyzed']}")
        elif args.command == "report":
            rows = storage.top_posts(limit=args.limit,
                                     relevant_only=args.relevant_only)
            for row in rows:
                flag = ""
                if row.get("relevant") is not None:
                    flag = " [RELEVANT]" if row["relevant"] else " [off-niche]"
                print(f"{row['virality_score']:6.1f}  {row['platform']:8s} "
                      f"{row['title'][:80]}{flag}")
                print(f"        {row['url']}")
                if row.get("repurpose_idea"):
                    print(f"        idea: {row['repurpose_idea']}")
        elif args.command == "export":
            count = storage.export_json(args.out, limit=args.limit,
                                        relevant_only=args.relevant_only)
            print(f"wrote {count} posts to {args.out}")
    finally:
        storage.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
