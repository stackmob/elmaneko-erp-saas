from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = Path("output/pdf/ZY-ATACADODINIZ-2026-PREINVENTARIO-MAN-001.pdf")
GREEN = colors.HexColor("#00B975")
DARK_GREEN = colors.HexColor("#00976A")
TEXT = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#6B7280")
LABEL = colors.HexColor("#9CA3AF")
BORDER = colors.HexColor("#E5E7EB")
ALT = colors.HexColor("#F9FAFB")


def register_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("ZayaArial", str(regular)))
        pdfmetrics.registerFont(TTFont("ZayaArialBold", str(bold)))
        return "ZayaArial", "ZayaArialBold"
    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def make_styles():
    styles = getSampleStyleSheet()
    return {
        "body": ParagraphStyle("Body", parent=styles["BodyText"], fontName=REGULAR, fontSize=10, leading=15.5, textColor=TEXT, spaceAfter=8),
        "section": ParagraphStyle("Section", fontName=BOLD, fontSize=11, leading=14, textColor=colors.white, backColor=GREEN, borderPadding=(8, 14, 8, 14), spaceBefore=18, spaceAfter=12, keepWithNext=True),
        "subsection": ParagraphStyle("Subsection", fontName=BOLD, fontSize=11.5, leading=14, textColor=GREEN, spaceBefore=0, spaceAfter=0, keepWithNext=True),
        "callout_label": ParagraphStyle("CalloutLabel", fontName=BOLD, fontSize=7.5, leading=9, textColor=GREEN, spaceAfter=4),
        "callout_warning": ParagraphStyle("CalloutWarning", fontName=BOLD, fontSize=7.5, leading=9, textColor=colors.HexColor("#B45309"), spaceAfter=4),
        "callout_risk": ParagraphStyle("CalloutRisk", fontName=BOLD, fontSize=7.5, leading=9, textColor=colors.HexColor("#B91C1C"), spaceAfter=4),
        "cell": ParagraphStyle("Cell", fontName=REGULAR, fontSize=8.6, leading=11.5, textColor=TEXT),
        "cell_bold": ParagraphStyle("CellBold", fontName=BOLD, fontSize=8.6, leading=11.5, textColor=TEXT),
        "footer": ParagraphStyle("Footer", fontName=REGULAR, fontSize=8, leading=10, textColor=LABEL, alignment=TA_CENTER),
        "meta_label": ParagraphStyle("MetaLabel", fontName=BOLD, fontSize=7.5, leading=10, textColor=GREEN),
        "meta_value": ParagraphStyle("MetaValue", fontName=REGULAR, fontSize=9.5, leading=12, textColor=TEXT),
        "cover_brand": ParagraphStyle("Brand", fontName=BOLD, fontSize=28, leading=34, textColor=GREEN, alignment=TA_CENTER),
        "cover_tag": ParagraphStyle("Tag", fontName=REGULAR, fontSize=9, leading=13, textColor=LABEL, alignment=TA_CENTER),
        "cover_type": ParagraphStyle("Type", fontName=REGULAR, fontSize=8, leading=11, textColor=GREEN, alignment=TA_CENTER),
        "cover_title": ParagraphStyle("Title", fontName=BOLD, fontSize=22, leading=28, textColor=TEXT, alignment=TA_CENTER),
        "cover_subtitle": ParagraphStyle("Subtitle", fontName=REGULAR, fontSize=10, leading=15, textColor=MUTED, alignment=TA_CENTER),
        "cover_badge": ParagraphStyle("Badge", fontName=BOLD, fontSize=7.5, leading=11, textColor=colors.white, alignment=TA_CENTER),
    }


STYLES = make_styles()


def paragraph(text, style="body"):
    return Paragraph(text, STYLES[style])


def section(title):
    return paragraph(title.upper(), "section")


def subsection(title):
    heading = Table([[paragraph(title, "subsection")]], colWidths=[174 * mm], hAlign="LEFT")
    heading.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    return KeepTogether([Spacer(1, 8), heading, Spacer(1, 8)])


def callout(label, text, kind="good"):
    label_style = {"good": "callout_label", "warning": "callout_warning", "risk": "callout_risk"}[kind]
    fill = {"good": colors.HexColor("#F0FDF4"), "warning": colors.HexColor("#FFFBEB"), "risk": colors.HexColor("#FEF2F2")}[kind]
    line = {"good": GREEN, "warning": colors.HexColor("#F59E0B"), "risk": colors.HexColor("#EF4444")}[kind]
    box = Table([[[paragraph(label.upper(), label_style), paragraph(text)]]], colWidths=[174 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("LINEBEFORE", (0, 0), (0, -1), 3, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([box, Spacer(1, 7)])


def data_table(headers, rows, widths):
    converted = [[paragraph(header, "cell_bold") for header in headers]]
    for row in rows:
        converted.append([paragraph(value, "cell_bold" if index == 0 else "cell") for index, value in enumerate(row)])
    table = Table(converted, colWidths=widths, repeatRows=1, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for row_index in range(2, len(converted), 2):
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), ALT))
    table.setStyle(TableStyle(commands))
    return table


def numbered(items):
    flowables = []
    for index, item in enumerate(items, 1):
        flowables.append(paragraph(f"<b>{index}.</b> {item}"))
    return flowables


def bullets(items):
    return [paragraph(f'<font color="#00B975">•</font>&nbsp;&nbsp;{item}') for item in items]


def standard_page(canvas, document):
    canvas.saveState()
    canvas.setFont(REGULAR, 7.5)
    canvas.setFillColor(LABEL)
    canvas.drawString(18 * mm, 11 * mm, "Zaya IT - Gestão de Negócios | Manual Operacional | v1.0")
    canvas.drawRightString(A4[0] - 18 * mm, 11 * mm, f"Página {document.page}")
    canvas.restoreState()


def cover_page(canvas, document):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(DARK_GREEN)
    canvas.rect(0, height - 12 * mm, width, 12 * mm, fill=1, stroke=0)
    canvas.rect(0, 0, width, 10 * mm, fill=1, stroke=0)
    canvas.restoreState()


def build_story():
    story = []
    story.extend([
        Spacer(1, 56 * mm),
        paragraph("ZAYA IT", "cover_brand"),
        paragraph("GESTÃO DE NEGÓCIOS", "cover_tag"),
        Spacer(1, 10),
        Table([[""]], colWidths=[36], rowHeights=[2.5], style=[("BACKGROUND", (0, 0), (-1, -1), GREEN), ("ALIGN", (0, 0), (-1, -1), "CENTER")], hAlign="CENTER"),
        Spacer(1, 18),
        paragraph("MANUAL OPERACIONAL", "cover_type"),
        Spacer(1, 13),
        paragraph("Pré-Inventário WMS", "cover_title"),
        Spacer(1, 8),
        paragraph("Verificação do Cockpit, condução da contagem e acompanhamento dos ajustes", "cover_subtitle"),
        Spacer(1, 20),
        Table([[paragraph("ATACADO DINIZ", "cover_badge")]], colWidths=[120], style=[("BACKGROUND", (0, 0), (-1, -1), GREEN), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)], hAlign="CENTER"),
        Spacer(1, 20),
    ])
    meta = [
        [paragraph("CLIENTE", "meta_label"), paragraph("Atacado Diniz", "meta_value")],
        [paragraph("PROJETO", "meta_label"), paragraph("Pré-Inventário WMS", "meta_value")],
        [paragraph("VERSÃO", "meta_label"), paragraph("1.0", "meta_value")],
        [paragraph("EMISSÃO", "meta_label"), paragraph(date.today().strftime("%d/%m/%Y"), "meta_value")],
        [paragraph("PÚBLICO", "meta_label"), paragraph("Gestão logística, líderes de inventário e usuários-chave", "meta_value")],
    ]
    meta_table = Table(meta, colWidths=[40 * mm, 100 * mm], hAlign="CENTER")
    meta_table.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.45, BORDER), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story.extend([meta_table, NextPageTemplate("standard"), PageBreak()])

    story += [
        section("1. Objetivo e escopo"),
        paragraph("Este manual orienta a equipe do Atacado Diniz na preparação do inventário por meio do Cockpit Pré-Inventário WMS, na decisão de liberação da contagem e no acompanhamento dos ajustes realizados."),
        callout("Premissa operacional", "O ambiente não utiliza coletor RF. Também não há tela padrão configurada para auditoria com recontagem nem para fechamento com emissão de notas fiscais. A recontagem é controlada operacionalmente e o acompanhamento posterior dos ajustes ocorre em <b>WMS &gt; Inventário &gt; Histórico de Ajuste de Estoque</b>.", "warning"),
        callout("Limite deste manual", "Não inicie a contagem enquanto houver indicador pendente no Cockpit. Quando o nome de uma tela for diferente no ambiente do usuário, interrompa a execução e solicite ao responsável o nome exato ou um print da tela antes de prosseguir.", "risk"),
        section("2. Verificação do Cockpit Pré-Inventário WMS"),
        subsection("2.1 Preparar a consulta"),
    ]
    story += numbered([
        "Abra o Cockpit Pré-Inventário WMS.",
        "Informe a empresa obrigatória e aplique os filtros necessários para a área que será inventariada.",
        "Quando aplicável, use os filtros de produto, rua, prédio inicial, prédio final, paridade e data inicial.",
        "Atualize a consulta antes de tomar qualquer decisão.",
    ])
    story += [
        subsection("2.2 Regra de liberação"),
        callout("Critério obrigatório", "O inventário só está liberado quando todos os sete indicadores do resumo estiverem em <b>OK</b> e com quantidade igual a <b>zero</b>. Qualquer valor diferente de zero indica processo em trânsito, pendência ou configuração que exige análise."),
    ]
    story.append(data_table(
        ["Indicador", "O que verificar", "Decisão"],
        [
            ("Tarefas pendentes/em execução", "Existência de tarefas ainda em andamento.", "Resolver antes da contagem."),
            ("Docas com saldo", "Saldo ainda existente em docas.", "Analisar e regularizar antes da contagem."),
            ("Docas configuradas como Ambos", "Docas que exigem análise de configuração.", "Validar com o responsável da operação."),
            ("Pedidos de venda pendentes de faturamento", "Pedidos que podem manter saldo lógico comprometido.", "Tratar antes da liberação."),
            ("Expedições pendentes", "Expedições não concluídas.", "Concluir ou tratar a pendência."),
            ("Recebimentos pendentes", "Recebimentos não concluídos.", "Concluir ou tratar a pendência."),
            ("Notas de compra não confirmadas", "Documentos de compra ainda não confirmados.", "Regularizar conforme processo interno."),
        ],
        [55 * mm, 65 * mm, 54 * mm],
    ))
    story += [subsection("2.3 Como tratar uma pendência")]
    story += numbered([
        "Identifique no resumo qual indicador está pendente.",
        "Abra o componente de detalhamento correspondente.",
        "Registre a pendência, o responsável e a decisão de tratamento conforme o processo interno.",
        "Depois da regularização, atualize o Cockpit e valide novamente o indicador.",
        "Libere a contagem somente após todos os indicadores retornarem a OK.",
    ])
    story += [section("3. Catálogo de telas usadas no processo")]
    story.append(data_table(
        ["Tela ou componente", "Quando usar", "Resultado esperado"],
        [
            ("Cockpit Pré-Inventário - Resumo", "Antes de gerar ou iniciar a contagem.", "Todos os indicadores devem estar em situação OK e com quantidade zero."),
            ("Cockpit Pré-Inventário - Operação WMS", "Quando o resumo indicar pendência operacional.", "Identificar tarefas em aberto, docas com saldo e docas configuradas como Ambos."),
            ("Cockpit Pré-Inventário - Documentos Pendentes", "Quando o resumo indicar pendência comercial ou logística.", "Identificar pedidos de venda pendentes de faturamento, expedições, recebimentos e notas de compra não confirmadas."),
            ("Contagem de Estoque", "Durante a execução do inventário, conforme orientação do responsável pela operação.", "Registrar e acompanhar a contagem no fluxo habilitado para a empresa."),
            ("WMS > Inventário > Histórico de Ajuste de Estoque", "Após os ajustes autorizados e no acompanhamento do fechamento.", "Consultar o histórico dos ajustes realizados e manter a rastreabilidade da decisão operacional."),
        ],
        [55 * mm, 60 * mm, 59 * mm],
    ))
    story += [callout("Orientação ao usuário", "Este catálogo é intencionalmente funcional. Não utilize identificadores técnicos, nomes de tabelas ou nomes de campos para navegar no sistema. Se uma tela não corresponder ao nome acima, envie o nome exibido no menu ou um print da tela ao responsável pelo processo.", "warning")]
    story += [section("4. Procedimento operacional"), subsection("4.1 Antes da contagem")]
    story += numbered([
        "Execute a verificação completa no Cockpit Pré-Inventário WMS.",
        "Trate todos os indicadores pendentes e confirme que o resumo está integralmente em OK.",
        "Registre a autorização do líder responsável para iniciar a contagem.",
    ])
    story += [subsection("4.2 Durante a contagem")]
    story += numbered([
        "Utilize a tela <b>Contagem de Estoque</b> de acordo com o fluxo habilitado para a empresa.",
        "Não presuma uso de coletor RF; siga o método de registro e conferência definido pela gestão logística.",
        "Ao identificar divergência, pause a decisão de ajuste e comunique o líder do inventário.",
    ])
    story += [
        subsection("4.3 Auditoria e recontagem sem rotina padrão"),
        paragraph("A auditoria e a recontagem não são conduzidas por uma tela padrão neste ambiente. O líder do inventário deve registrar a solicitação, definir o responsável pela nova contagem e comparar o resultado com a primeira apuração antes de autorizar qualquer ajuste."),
        callout("Controle recomendado", "Para cada recontagem, mantenha evidência da área conferida, data, responsável, motivo e decisão final. Não trate a divergência como concluída apenas porque a contagem foi repetida.", "warning"),
        subsection("4.4 Acompanhamento do ajuste"),
    ]
    story += numbered([
        "Após a autorização do ajuste, acesse <b>WMS &gt; Inventário &gt; Histórico de Ajuste de Estoque</b>.",
        "Consulte os registros relacionados ao inventário em análise.",
        "Confronte o resultado com a decisão aprovada pela liderança e mantenha a evidência no controle interno.",
        "Quando houver necessidade fiscal, siga o procedimento aprovado pelo setor fiscal. A emissão de notas fiscais não é executada por este manual.",
    ])
    story += [section("5. Checklist de encerramento")]
    story += bullets([
        "Todos os indicadores do Cockpit estão em OK e zerados antes da contagem.",
        "As pendências identificadas foram tratadas e registradas.",
        "A contagem foi autorizada pelo responsável da operação.",
        "As recontagens necessárias possuem evidência e decisão registrada.",
        "Os ajustes autorizados foram consultados no Histórico de Ajuste de Estoque.",
        "Demandas fiscais foram encaminhadas conforme o processo interno.",
    ])
    story += [
        Spacer(1, 3),
        paragraph("Documento elaborado a partir dos componentes do Cockpit Pré-Inventário WMS e das premissas operacionais confirmadas para o Atacado Diniz.", "footer"),
    ]
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(18 * mm, 18 * mm, A4[0] - 36 * mm, A4[1] - 40 * mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    cover_frame = Frame(25 * mm, 20 * mm, A4[0] - 50 * mm, A4[1] - 30 * mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    document = BaseDocTemplate(str(OUTPUT), pagesize=A4, title="Manual Operacional - Pré-Inventário WMS", author="Zaya IT")
    document.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="standard", frames=[frame], onPage=standard_page),
    ])
    document.build(build_story())
    print(OUTPUT.resolve())


if __name__ == "__main__":
    main()
