#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Render the deterministic README preview for Substratism VIZ."""

from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "substratism-viz.svg"

WIDTH = 1280
HEIGHT = 720
BACKGROUND = "#070909"
SURFACE = "#111716"
LINE = "#44504d"
INK = "#e5e4dc"
MUTED = "#929b96"
AMBER = "#d4a85f"
AMBER_BRIGHT = "#efd18d"
MINERAL = "#70a39a"

BRANCHES = [
    (
        "DEFINITION AND CORE CONCEPT",
        ["non-biological substrate", "chips rather than neurons", "direct substrate bias", "indirect capacity denial"],
    ),
    (
        "8-ITEM VALIDATED SCALE",
        ["unidimensional / 8 items", "7-point / item 2 reversed", "alpha = 0.84-0.91", "substrate / rights / tools / capacity"],
    ),
    (
        "RELATION TO OTHER PREJUDICES",
        ["racism / sexism / homophobia: n.s.", "speciesism .12 / transphobia .14", "xenophobia .10 / SDO .01-.03", "demographic paradox"],
    ),
    (
        "MORAL AND BEHAVIOURAL IMPACT",
        ["dilemmas beta -.29 / -.23", "donations beta -.25 / -.31", "advocacy OR .66 / .74", "persists with sentience controls"],
    ),
]


def node(x: float, y: float, width: float, height: float, label: str, accent: str, root: bool = False) -> str:
    fill = "#181712" if root else SURFACE
    font_size = 14 if root else 11
    weight = 700 if root else 600
    return (
        f'<g><rect x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" '
        f'rx="3" fill="{fill}" stroke="{accent}" stroke-opacity=".82"/>'
        f'<text x="{x + 12:.1f}" y="{y + height / 2 + 4:.1f}" fill="{INK if root else MUTED}" '
        f'font-family="monospace" font-size="{font_size}" font-weight="{weight}">{escape(label)}</text></g>'
    )


def curve(x1: float, y1: float, x2: float, y2: float, color: str, opacity: float = 0.72) -> str:
    bend = (x2 - x1) * 0.48
    return (
        f'<path d="M{x1:.1f},{y1:.1f} C{x1 + bend:.1f},{y1:.1f} '
        f'{x2 - bend:.1f},{y2:.1f} {x2:.1f},{y2:.1f}" '
        f'fill="none" stroke="{color}" stroke-opacity="{opacity}" stroke-width="1.4"/>'
    )


def build_svg() -> str:
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "<title>Substratism VIZ concept topology and scale lattice</title>",
        "<desc>Four research branches share an audiovisual state with an eight-item corrected scale lattice.</desc>",
        "<defs>",
        '<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d4a85f" stop-opacity=".19"/><stop offset="1" stop-color="#d4a85f" stop-opacity="0"/></radialGradient>',
        '<pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#29312f" stroke-opacity=".34"/></pattern>',
        "</defs>",
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{BACKGROUND}"/>',
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#grid)"/>',
        '<circle cx="1000" cy="354" r="280" fill="url(#halo)"/>',
        f'<text x="48" y="50" fill="{AMBER}" font-family="monospace" font-size="11" font-weight="700" letter-spacing="2">QSOL-IMC / PSYCHOMETRIC RECEIVER LAB</text>',
        f'<text x="48" y="87" fill="{INK}" font-family="sans-serif" font-size="34" font-weight="700">Substratism VIZ</text>',
        f'<text x="48" y="111" fill="{MUTED}" font-family="sans-serif" font-size="13">Moral substrate topology, measured associations, and one shared audiovisual signal path.</text>',
    ]

    root_x, root_y, root_w, root_h = 54, 334, 150, 42
    parts.append(node(root_x, root_y, root_w, root_h, "SUBSTRATISM", AMBER, True))
    parts.append(
        f'<text x="{root_x}" y="{root_y + 62}" fill="{MUTED}" font-family="monospace" font-size="9">configured score 4.00 / 7</text>'
    )

    branch_x, branch_w, branch_h = 286, 220, 38
    child_x, child_w, child_h = 580, 224, 27
    branch_centers = [178, 302, 426, 550]
    for branch_index, ((title, children), center_y) in enumerate(zip(BRANCHES, branch_centers)):
        accent = MINERAL if branch_index < 2 else AMBER
        branch_y = center_y - branch_h / 2
        parts.append(curve(root_x + root_w, root_y + root_h / 2, branch_x, center_y, accent, 0.58))
        parts.append(node(branch_x, branch_y, branch_w, branch_h, title, accent))
        start_y = center_y - (len(children) * child_h + (len(children) - 1) * 5) / 2
        for child_index, child in enumerate(children):
            child_y = start_y + child_index * (child_h + 5)
            parts.append(curve(branch_x + branch_w, center_y, child_x, child_y + child_h / 2, accent, 0.42))
            parts.append(node(child_x, child_y, child_w, child_h, child, accent))

    center_x, center_y, radius = 1030, 360, 206
    for ring in range(1, 8):
        points = []
        for index in range(8):
            angle = -3.141592653589793 / 2 + index / 8 * 3.141592653589793 * 2
            r = radius * ring / 7
            from math import cos, sin

            points.append(f"{center_x + cos(angle) * r:.1f},{center_y + sin(angle) * r:.1f}")
        parts.append(
            f'<polygon points="{" ".join(points)}" fill="none" stroke="{LINE}" '
            f'stroke-opacity="{0.7 if ring == 4 else 0.34}"/>'
        )

    values = [5, 3, 6, 4, 5, 2, 6, 4]
    value_points = []
    from math import cos, sin, pi

    for index, value in enumerate(values):
        angle = -pi / 2 + index / 8 * pi * 2
        r = radius * value / 7
        x = center_x + cos(angle) * r
        y = center_y + sin(angle) * r
        value_points.append(f"{x:.1f},{y:.1f}")
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="{AMBER if index % 2 == 0 else MINERAL}"/>')
        label_x = center_x + cos(angle) * (radius + 29)
        label_y = center_y + sin(angle) * (radius + 29)
        parts.append(
            f'<text x="{label_x:.1f}" y="{label_y + 3:.1f}" fill="{MUTED}" '
            f'font-family="monospace" font-size="9" text-anchor="middle">{index + 1}</text>'
        )
    parts.append(
        f'<polygon points="{" ".join(value_points)}" fill="{AMBER}" fill-opacity=".12" '
        f'stroke="{AMBER_BRIGHT}" stroke-width="1.8"/>'
    )
    parts.append(
        f'<text x="{center_x}" y="{center_y - 4}" fill="{INK}" font-family="monospace" '
        f'font-size="28" font-weight="700" text-anchor="middle">4.00</text>'
    )
    parts.append(
        f'<text x="{center_x}" y="{center_y + 18}" fill="{MUTED}" font-family="monospace" '
        f'font-size="9" text-anchor="middle">CORRECTED MEAN / 7</text>'
    )
    parts.extend(
        [
            f'<circle cx="870" cy="666" r="5" fill="{AMBER}"/><text x="883" y="670" fill="{MUTED}" font-family="monospace" font-size="9">biological priority</text>',
            f'<circle cx="1010" cy="666" r="5" fill="{MINERAL}"/><text x="1023" y="670" fill="{MUTED}" font-family="monospace" font-size="9">digital priority</text>',
            f'<circle cx="1140" cy="666" r="5" fill="{INK}" stroke="{AMBER}"/><text x="1153" y="670" fill="{MUTED}" font-family="monospace" font-size="9">configured receiver</text>',
            "</svg>",
        ]
    )
    return "\n".join(parts) + "\n"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(build_svg(), encoding="utf-8")
    print(f"Rendered {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
