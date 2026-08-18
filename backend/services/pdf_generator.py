from pathlib import Path
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)


# ============================================================
# OUTPUT
# ============================================================

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================================
# HELPERS
# ============================================================

DARK = colors.HexColor("#111111")
GOLD = colors.HexColor("#927A5A")
LIGHT_GOLD = colors.HexColor("#F4EFE7")
SOFT = colors.HexColor("#F7F6F3")
MID = colors.HexColor("#777777")
LINE = colors.HexColor("#E5E2DC")
WHITE = colors.white


def safe_text(value, fallback=""):
    if value is None:
        return fallback

    return escape(str(value))


def money(value):
    try:
        return f"₹{float(value):,.0f}"
    except (TypeError, ValueError):
        return "—"


def build_page_number(canvas, doc):
    """
    Minimal premium footer.
    """

    canvas.saveState()

    width, _ = A4

    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)

    canvas.line(
        18 * mm,
        13 * mm,
        width - 18 * mm,
        13 * mm,
    )

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MID)

    canvas.drawString(
        18 * mm,
        8 * mm,
        "VOYAGEAI · INTELLIGENT TRAVEL",
    )

    canvas.drawRightString(
        width - 18 * mm,
        8 * mm,
        f"{doc.page}",
    )

    canvas.restoreState()


# ============================================================
# PDF GENERATOR
# ============================================================

def generate_trip_pdf(state: dict) -> str:

    destination = state.get(
        "destination",
        "Your Destination",
    )

    filename = (
        f"VoyageAI_"
        f"{destination.replace(' ', '_')}"
        f"_Travel_Plan.pdf"
    )

    filepath = OUTPUT_DIR / filename

    # --------------------------------------------------------
    # DOCUMENT
    # --------------------------------------------------------

    doc = SimpleDocTemplate(
        str(filepath),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title=f"VoyageAI — {destination}",
        author="VoyageAI",
    )

    styles = getSampleStyleSheet()

    # --------------------------------------------------------
    # STYLES
    # --------------------------------------------------------

    cover_brand = ParagraphStyle(
        "CoverBrand",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=GOLD,
        tracking=3,
        spaceAfter=15,
    )

    cover_destination = ParagraphStyle(
        "CoverDestination",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=34,
        leading=38,
        textColor=DARK,
        spaceAfter=12,
    )

    cover_subtitle = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        textColor=MID,
        spaceAfter=8,
    )

    section_label = ParagraphStyle(
        "SectionLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=GOLD,
        spaceAfter=6,
    )

    section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=DARK,
        spaceBefore=4,
        spaceAfter=12,
    )

    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=15,
        textColor=colors.HexColor("#555555"),
        spaceAfter=6,
    )

    small = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        leading=12,
        textColor=MID,
    )

    card_title = ParagraphStyle(
        "CardTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=DARK,
        spaceAfter=5,
    )

    day_number = ParagraphStyle(
        "DayNumber",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=GOLD,
    )

    day_title = ParagraphStyle(
        "DayTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=DARK,
        spaceBefore=2,
        spaceAfter=7,
    )

    quote_style = ParagraphStyle(
        "Quote",
        parent=styles["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=11,
        leading=18,
        textColor=colors.HexColor("#444444"),
        leftIndent=8,
        rightIndent=8,
    )

    # --------------------------------------------------------
    # STORY
    # --------------------------------------------------------

    story = []

    # ========================================================
    # COVER
    # ========================================================

    story.append(Spacer(1, 35 * mm))

    story.append(
        Paragraph(
            "VOYAGEAI",
            cover_brand,
        )
    )

    story.append(
        Paragraph(
            safe_text(destination).upper(),
            cover_destination,
        )
    )

    story.append(
        Paragraph(
            "YOUR JOURNEY, BEAUTIFULLY PLANNED.",
            cover_subtitle,
        )
    )

    story.append(Spacer(1, 12 * mm))

    # Elegant divider

    divider = Table(
        [[""]],
        colWidths=[42 * mm],
        rowHeights=[0.8 * mm],
    )

    divider.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                GOLD,
            ),
        ])
    )

    story.append(divider)

    story.append(Spacer(1, 18 * mm))

    # Trip metadata

    overview = [
        [
            Paragraph(
                "<b>TRAVELERS</b>",
                small,
            ),
            Paragraph(
                safe_text(
                    state.get(
                        "travelers",
                        "—",
                    )
                ),
                body,
            ),
        ],
        [
            Paragraph(
                "<b>DURATION</b>",
                small,
            ),
            Paragraph(
                f"{safe_text(state.get('days', '—'))} days",
                body,
            ),
        ],
        [
            Paragraph(
                "<b>TRAVEL STYLE</b>",
                small,
            ),
            Paragraph(
                safe_text(
                    state.get(
                        "travel_style",
                        "Personalized",
                    )
                ),
                body,
            ),
        ],
        [
            Paragraph(
                "<b>BUDGET</b>",
                small,
            ),
            Paragraph(
                money(
                    state.get(
                        "budget",
                        0,
                    )
                ),
                body,
            ),
        ],
        [
            Paragraph(
                "<b>DATES</b>",
                small,
            ),
            Paragraph(
                f"{safe_text(state.get('check_in', ''))}"
                f" → "
                f"{safe_text(state.get('check_out', ''))}",
                body,
            ),
        ],
    ]

    overview_table = Table(
        overview,
        colWidths=[
            43 * mm,
            107 * mm,
        ],
    )

    overview_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                SOFT,
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.5,
                LINE,
            ),
            (
                "INNERGRID",
                (0, 0),
                (-1, -1),
                0.25,
                LINE,
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10,
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10,
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8,
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE",
            ),
        ])
    )

    story.append(overview_table)

    story.append(Spacer(1, 25 * mm))

    story.append(
        Paragraph(
            "A personalized travel book created by VoyageAI.",
            cover_subtitle,
        )
    )

    story.append(PageBreak())

    # ========================================================
    # TRIP OVERVIEW
    # ========================================================

    story.append(
        Paragraph(
            "THE JOURNEY",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "Designed around you.",
            section_title,
        )
    )

    summary = state.get(
        "itinerary_summary",
        "Your personalized journey.",
    )

    story.append(
        Paragraph(
            safe_text(summary),
            quote_style,
        )
    )

    story.append(Spacer(1, 12 * mm))

    # ========================================================
    # BUDGET
    # ========================================================

    story.append(
        Paragraph(
            "YOUR INVESTMENT",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "Where your money goes.",
            section_title,
        )
    )

    budget = state.get(
        "budget_breakdown",
        {},
    )

    budget_rows = [
        [
            Paragraph("<b>CATEGORY</b>", small),
            Paragraph("<b>ALLOCATION</b>", small),
        ]
    ]

    for category, amount in budget.items():

        if isinstance(
            amount,
            (int, float),
        ):
            budget_rows.append(
                [
                    Paragraph(
                        safe_text(
                            category.replace(
                                "_",
                                " ",
                            ).title()
                        ),
                        body,
                    ),
                    Paragraph(
                        money(amount),
                        body,
                    ),
                ]
            )

    if len(budget_rows) > 1:

        budget_table = Table(
            budget_rows,
            colWidths=[
                90 * mm,
                60 * mm,
            ],
        )

        budget_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    DARK,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    WHITE,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    LINE,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [WHITE, SOFT],
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ])
        )

        story.append(budget_table)

    story.append(Spacer(1, 12 * mm))

    # ========================================================
    # HOTELS
    # ========================================================

    story.append(
        Paragraph(
            "YOUR STAY",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "Where you'll wake up.",
            section_title,
        )
    )

    hotels = state.get(
        "hotel_recommendations",
        [],
    )

    for index, hotel in enumerate(hotels[:3]):

        hotel_name = safe_text(
            hotel.get(
                "name",
                "Recommended hotel",
            )
        )

        rating = hotel.get(
            "rating",
            "N/A",
        )

        price = hotel.get(
            "price_per_night",
            None,
        )

        amenities = hotel.get(
            "amenities",
            [],
        )

        hotel_rows = [
            [
                Paragraph(
                    hotel_name,
                    card_title,
                ),
                Paragraph(
                    f"★ {safe_text(rating)}",
                    body,
                ),
            ],
            [
                Paragraph(
                    (
                        f"{money(price)} / night"
                        if price is not None
                        else "Price unavailable"
                    ),
                    body,
                ),
                Paragraph(
                    (
                        ", ".join(
                            [
                                safe_text(x)
                                for x in amenities[:4]
                            ]
                        )
                        if amenities
                        else "Selected for your journey."
                    ),
                    small,
                ),
            ],
        ]

        hotel_table = Table(
            hotel_rows,
            colWidths=[
                72 * mm,
                78 * mm,
            ],
        )

        hotel_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    SOFT,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    LINE,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
            ])
        )

        story.append(
            KeepTogether(
                [
                    Paragraph(
                        f"0{index + 1}",
                        day_number,
                    ),
                    hotel_table,
                    Spacer(1, 5 * mm),
                ]
            )
        )

    # ========================================================
    # DINING
    # ========================================================

    story.append(
        Paragraph(
            "DINING",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "Places worth remembering.",
            section_title,
        )
    )

    restaurants = state.get(
        "restaurant_recommendations",
        [],
    )

    for index, restaurant in enumerate(
        restaurants[:5]
    ):

        restaurant_name = safe_text(
            restaurant.get(
                "name",
                "Recommended restaurant",
            )
        )

        rating = restaurant.get(
            "rating",
            "N/A",
        )

        restaurant_type = safe_text(
            restaurant.get(
                "type",
                "",
            )
        )

        address = safe_text(
            restaurant.get(
                "address",
                "",
            )
        )

        dining_text = (
            f"★ {safe_text(rating)}"
        )

        if restaurant_type:
            dining_text += (
                f" · {restaurant_type}"
            )

        restaurant_rows = [
            [
                Paragraph(
                    restaurant_name,
                    card_title,
                ),
                Paragraph(
                    dining_text,
                    body,
                ),
            ],
            [
                Paragraph(
                    address
                    or "Address unavailable",
                    small,
                ),
                Paragraph(
                    "Curated for your dining experience.",
                    small,
                ),
            ],
        ]

        restaurant_table = Table(
            restaurant_rows,
            colWidths=[
                72 * mm,
                78 * mm,
            ],
        )

        restaurant_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    WHITE,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    LINE,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
            ])
        )

        story.append(
            KeepTogether(
                [
                    Paragraph(
                        f"0{index + 1}",
                        day_number,
                    ),
                    restaurant_table,
                    Spacer(1, 5 * mm),
                ]
            )
        )

    # ========================================================
    # WEATHER
    # ========================================================

    story.append(
        Paragraph(
            "TRAVEL CONDITIONS",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "The days ahead.",
            section_title,
        )
    )

    story.append(
        Paragraph(
            safe_text(
                state.get(
                    "weather_summary",
                    "Weather information unavailable.",
                )
            ),
            body,
        )
    )

    weather = state.get(
        "weather",
        {},
    )

    daily = (
        weather.get(
            "daily",
            {}
        )
        if isinstance(weather, dict)
        else {}
    )

    dates = daily.get(
        "time",
        [],
    )

    max_temps = daily.get(
        "temperature_2m_max",
        [],
    )

    min_temps = daily.get(
        "temperature_2m_min",
        [],
    )

    rain = daily.get(
        "precipitation_probability_max",
        [],
    )

    if dates:

        weather_rows = [
            [
                Paragraph("<b>DATE</b>", small),
                Paragraph("<b>HIGH</b>", small),
                Paragraph("<b>LOW</b>", small),
                Paragraph("<b>RAIN</b>", small),
            ]
        ]

        for index, date in enumerate(
            dates
        ):

            high = (
                max_temps[index]
                if index < len(max_temps)
                else None
            )

            low = (
                min_temps[index]
                if index < len(min_temps)
                else None
            )

            rain_value = (
                rain[index]
                if index < len(rain)
                else None
            )

            weather_rows.append(
                [
                    Paragraph(
                        safe_text(date),
                        body,
                    ),
                    Paragraph(
                        (
                            f"{round(high)}°"
                            if high is not None
                            else "—"
                        ),
                        body,
                    ),
                    Paragraph(
                        (
                            f"{round(low)}°"
                            if low is not None
                            else "—"
                        ),
                        body,
                    ),
                    Paragraph(
                        (
                            f"{round(rain_value)}%"
                            if rain_value is not None
                            else "—"
                        ),
                        body,
                    ),
                ]
            )

        weather_table = Table(
            weather_rows,
            colWidths=[
                75 * mm,
                25 * mm,
                25 * mm,
                25 * mm,
            ],
        )

        weather_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    DARK,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    WHITE,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [WHITE, SOFT],
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    LINE,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ])
        )

        story.append(
            weather_table
        )

    # ========================================================
    # ITINERARY
    # ========================================================

    story.append(PageBreak())

    story.append(
        Paragraph(
            "THE JOURNEY",
            section_label,
        )
    )

    story.append(
        Paragraph(
            "Your day-by-day experience.",
            section_title,
        )
    )

    itinerary = state.get(
        "itinerary",
        [],
    )

    for day_index, day in enumerate(
        itinerary
    ):

        number = day.get(
            "day",
            day_index + 1,
        )

        title = safe_text(
            day.get(
                "title",
                f"Day {number}",
            )
        )

        date = safe_text(
            day.get(
                "date",
                "",
            )
        )

        morning = safe_text(
            day.get(
                "morning",
                "",
            )
        )

        afternoon = safe_text(
            day.get(
                "afternoon",
                "",
            )
        )

        evening = safe_text(
            day.get(
                "evening",
                "",
            )
        )

        dining = safe_text(
            day.get(
                "dining",
                "",
            )
        )

        notes = safe_text(
            day.get(
                "notes",
                "",
            )
        )

        day_story = []

        day_story.append(
            Paragraph(
                f"DAY {safe_text(number)}",
                day_number,
            )
        )

        day_story.append(
            Paragraph(
                title,
                day_title,
            )
        )

        if date:
            day_story.append(
                Paragraph(
                    f"<b>Date:</b> {date}",
                    body,
                )
            )

        if morning:
            day_story.append(
                Paragraph(
                    f"<b>Morning</b> · {morning}",
                    body,
                )
            )

        if afternoon:
            day_story.append(
                Paragraph(
                    f"<b>Afternoon</b> · {afternoon}",
                    body,
                )
            )

        if evening:
            day_story.append(
                Paragraph(
                    f"<b>Evening</b> · {evening}",
                    body,
                )
            )

        if dining:
            day_story.append(
                Paragraph(
                    f"<b>Dining</b> · {dining}",
                    body,
                )
            )

        if notes:
            day_story.append(
                Paragraph(
                    f"<b>Notes</b> · {notes}",
                    body,
                )
            )

        day_table = Table(
            [[day_story]],
            colWidths=[
                150 * mm,
            ],
        )

        day_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    SOFT,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    LINE,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    12,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    12,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    11,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    11,
                ),
            ])
        )

        story.append(
            KeepTogether(
                [
                    day_table,
                    Spacer(1, 7 * mm),
                ]
            )
        )

    # ========================================================
    # BACK COVER
    # ========================================================

    story.append(PageBreak())

    story.append(
        Spacer(1, 55 * mm)
    )

    story.append(
        Paragraph(
            "VOYAGEAI",
            cover_brand,
        )
    )

    story.append(
        Paragraph(
            "YOUR JOURNEY<br/>IS READY.",
            cover_destination,
        )
    )

    story.append(
        Spacer(1, 8 * mm)
    )

    story.append(
        Paragraph(
            "Travel thoughtfully. Experience more.",
            cover_subtitle,
        )
    )

    story.append(
        Spacer(1, 25 * mm)
    )

    story.append(
        Paragraph(
            safe_text(destination),
            cover_subtitle,
        )
    )

    # ========================================================
    # BUILD
    # ========================================================

    doc.build(
        story,
        onFirstPage=build_page_number,
        onLaterPages=build_page_number,
    )

    return str(filepath)