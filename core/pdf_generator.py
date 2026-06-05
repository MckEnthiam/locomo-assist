import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from data.exercises import EXERCISES
from data.session_state import SessionState


def _format_duration(seconds: int) -> str:
    minutes, secs = divmod(seconds, 60)
    return f"{minutes:02d}:{secs:02d}"


def _global_score(session_state: SessionState) -> float:
    total_reps_done = sum(r.reps_completed for r in session_state.exercise_results)
    total_reps_target = sum(EXERCISES[i].reps for i in range(len(EXERCISES)))
    if total_reps_target == 0:
        return 0.0
    return min(100.0, (total_reps_done / total_reps_target) * 100)


def generate_report(session_state: SessionState, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    elements = []

    now = datetime.now()
    elements.append(Paragraph("<b>LocomoAssist</b>", styles["Title"]))
    elements.append(
        Paragraph(
            f"Rapport de session — {now.strftime('%d/%m/%Y')} à {now.strftime('%H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 16))

    completed = sum(1 for r in session_state.exercise_results if r.status == "done")
    elements.append(Paragraph("<b>Résumé</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Durée : {_format_duration(session_state.session_timer)}<br/>"
            f"Exercices complétés : {completed}/{len(EXERCISES)}<br/>"
            f"Score global : {_global_score(session_state):.0f}%",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("<b>Détail par exercice</b>", styles["Heading2"]))
    table_data = [
        [
            "Exercice",
            "Amp. moy.",
            "Amp. max",
            "Reps",
            "Compensations",
            "Statut",
        ]
    ]
    for result in session_state.exercise_results:
        comp_total = sum(result.compensations.values()) if result.compensations else 0
        table_data.append(
            [
                result.exercise_name,
                f"{result.avg_amplitude:.0f}",
                f"{result.peak_amplitude:.0f}",
                f"{result.reps_completed}",
                str(comp_total),
                result.status,
            ]
        )

    table = Table(table_data, colWidths=[140, 55, 55, 40, 80, 55])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E1F5EE")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#085041")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F6F5")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 16))

    warn_messages = [
        m for m in session_state.coach_messages if m.msg_type == "warn"
    ]
    if warn_messages:
        elements.append(Paragraph("<b>Alertes coach</b>", styles["Heading2"]))
        for msg in warn_messages:
            elements.append(Paragraph(f"• {msg.text}", styles["Normal"]))
        elements.append(Spacer(1, 16))

    elements.append(
        Paragraph(
            "<i>Rapport généré par LocomoAssist — À partager avec votre médecin</i>",
            styles["Normal"],
        )
    )

    doc.build(elements)
    return output_path
