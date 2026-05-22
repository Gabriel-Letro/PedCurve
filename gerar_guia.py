from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# ── Arquivo de saída ──────────────────────────────────────────────────────────
OUTPUT = r"C:\Users\gabri\OneDrive\Área de Trabalho\Como Abrir o PedCurve no Mac.pdf"

# ── Cores ─────────────────────────────────────────────────────────────────────
AZUL_TITULO   = colors.HexColor("#1A56DB")
AZUL_PASSO    = colors.HexColor("#1E40AF")
AZUL_CLARO    = colors.HexColor("#EFF6FF")
AZUL_BORDA    = colors.HexColor("#BFDBFE")
VERDE         = colors.HexColor("#15803D")
VERDE_CLARO   = colors.HexColor("#F0FDF4")
VERDE_BORDA   = colors.HexColor("#BBF7D0")
AMARELO_CLARO = colors.HexColor("#FFFBEB")
AMARELO_BORDA = colors.HexColor("#FDE68A")
CINZA_FUNDO   = colors.HexColor("#F8FAFC")
CINZA_TEXTO   = colors.HexColor("#374151")
CINZA_CLARO   = colors.HexColor("#6B7280")
CODIGO_FUNDO  = colors.HexColor("#1E293B")
CODIGO_TEXTO  = colors.HexColor("#E2E8F0")
BRANCO        = colors.white

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm,   bottomMargin=2*cm,
)
W = A4[0] - 4*cm   # largura útil

estilos = getSampleStyleSheet()

# ── Estilos customizados ──────────────────────────────────────────────────────
titulo_doc = ParagraphStyle("titulo_doc",
    fontName="Helvetica-Bold", fontSize=22, textColor=AZUL_TITULO,
    alignment=TA_CENTER, spaceAfter=4)

subtitulo_doc = ParagraphStyle("subtitulo_doc",
    fontName="Helvetica", fontSize=11, textColor=CINZA_CLARO,
    alignment=TA_CENTER, spaceAfter=2)

secao = ParagraphStyle("secao",
    fontName="Helvetica-Bold", fontSize=13, textColor=AZUL_PASSO,
    spaceBefore=14, spaceAfter=6)

corpo = ParagraphStyle("corpo",
    fontName="Helvetica", fontSize=10.5, textColor=CINZA_TEXTO,
    leading=16, spaceAfter=6, alignment=TA_JUSTIFY)

corpo_bold = ParagraphStyle("corpo_bold",
    fontName="Helvetica-Bold", fontSize=10.5, textColor=CINZA_TEXTO,
    leading=16, spaceAfter=4)

codigo_estilo = ParagraphStyle("codigo",
    fontName="Courier-Bold", fontSize=11, textColor=CODIGO_TEXTO,
    alignment=TA_CENTER, leading=16)

tip_estilo = ParagraphStyle("tip",
    fontName="Helvetica", fontSize=10, textColor=VERDE,
    leading=14, spaceAfter=2)

aviso_estilo = ParagraphStyle("aviso",
    fontName="Helvetica", fontSize=10, textColor=colors.HexColor("#92400E"),
    leading=14, spaceAfter=2)

rodape_estilo = ParagraphStyle("rodape",
    fontName="Helvetica", fontSize=8.5, textColor=CINZA_CLARO,
    alignment=TA_CENTER)

# ── Funções auxiliares ────────────────────────────────────────────────────────
def caixa_passo(numero, titulo_passo, conteudo_flowables):
    """Cria um bloco de passo numerado com caixa colorida."""
    badge = Table(
        [[Paragraph(str(numero), ParagraphStyle("badge",
            fontName="Helvetica-Bold", fontSize=13,
            textColor=BRANCO, alignment=TA_CENTER))]],
        colWidths=[0.7*cm], rowHeights=[0.7*cm]
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), AZUL_PASSO),
        ("ROUNDEDCORNERS", [4]),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0), (-1,-1), 2),
        ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ("TOPPADDING",   (0,0), (-1,-1), 1),
        ("BOTTOMPADDING",(0,0), (-1,-1), 1),
    ]))
    titulo_cell = Paragraph(titulo_passo, ParagraphStyle("titulo_passo",
        fontName="Helvetica-Bold", fontSize=12, textColor=AZUL_PASSO, leading=16))

    cabecalho = Table([[badge, titulo_cell]], colWidths=[1*cm, W - 0.6*cm])
    cabecalho.setStyle(TableStyle([
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING",(0,0), (-1,-1), 0),
        ("TOPPADDING",  (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ]))

    inner = [[cabecalho]] + [[f] for f in conteudo_flowables]
    caixa = Table(inner, colWidths=[W - 0.8*cm])
    caixa.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), AZUL_CLARO),
        ("BOX",           (0,0), (-1,-1), 1, AZUL_BORDA),
        ("ROUNDEDCORNERS",[6]),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (0,0),   10),
        ("TOPPADDING",    (0,1), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-2), 2),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 10),
    ]))
    return caixa

def caixa_codigo(texto):
    """Bloco de código escuro com fonte monoespaçada."""
    t = Table([[Paragraph(texto, codigo_estilo)]], colWidths=[W - 0.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CODIGO_FUNDO),
        ("ROUNDEDCORNERS",[6]),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ]))
    return t

def caixa_dica(texto):
    t = Table([[Paragraph("DICA  " + texto, tip_estilo)]], colWidths=[W - 0.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), VERDE_CLARO),
        ("BOX",           (0,0), (-1,-1), 1, VERDE_BORDA),
        ("ROUNDEDCORNERS",[6]),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

def caixa_aviso(texto):
    t = Table([[Paragraph("ATENCAO  " + texto, aviso_estilo)]], colWidths=[W - 0.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), AMARELO_CLARO),
        ("BOX",           (0,0), (-1,-1), 1, AMARELO_BORDA),
        ("ROUNDEDCORNERS",[6]),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

# ── Conteúdo ──────────────────────────────────────────────────────────────────
historia = []

# Cabeçalho
historia.append(Paragraph("Como Abrir o PedCurve no Mac", titulo_doc))
historia.append(Paragraph("Guia passo a passo para quem nunca programou", subtitulo_doc))
historia.append(HRFlowable(width=W, thickness=1.5, color=AZUL_BORDA, spaceAfter=14))

# Intro
historia.append(Paragraph(
    "Este guia vai te ajudar a baixar e abrir o aplicativo PedCurve no seu Mac "
    "sem precisar saber nada de programacao. Basta seguir cada passo com calma.",
    corpo))
historia.append(Spacer(1, 8))

# ── Passo 1 ───────────────────────────────────────────────────────────────────
historia.append(caixa_passo(1, "Instale o Node.js (feito uma unica vez)", [
    Paragraph("O Node.js e o programa que permite rodar o aplicativo no seu computador. "
              "Sem ele, o PedCurve nao consegue funcionar.", corpo),
    Spacer(1, 4),
    Paragraph("1.1  Abra o navegador (Safari, Chrome ou qualquer outro) e acesse:", corpo_bold),
    caixa_codigo("https://nodejs.org"),
    Spacer(1, 6),
    Paragraph("1.2  Clique no botao verde escrito <b>\"Download Node.js (LTS)\"</b>. "
              "O arquivo sera baixado automaticamente.", corpo),
    Spacer(1, 4),
    Paragraph("1.3  Abra o arquivo baixado (termina em <b>.pkg</b>) e siga o instalador "
              "clicando em <b>\"Continuar\"</b> e <b>\"Instalar\"</b> ate concluir.", corpo),
    Spacer(1, 4),
    caixa_dica("Se o Mac pedir a sua senha durante a instalacao, e normal. "
               "Digite a senha que voce usa para ligar o computador."),
]))
historia.append(Spacer(1, 10))

# ── Passo 2 ───────────────────────────────────────────────────────────────────
historia.append(caixa_passo(2, "Baixe o projeto do GitHub", [
    Paragraph("O PedCurve esta armazenado no GitHub, que e uma plataforma para "
              "guardar e compartilhar aplicativos.", corpo),
    Spacer(1, 4),
    Paragraph("2.1  Acesse o link abaixo no navegador:", corpo_bold),
    caixa_codigo("https://github.com/Gabriel-Letro/PedCurve"),
    Spacer(1, 6),
    Paragraph("2.2  Clique no botao verde <b>\"&lt; &gt; Code\"</b> (canto superior direito da pagina).", corpo),
    Spacer(1, 4),
    Paragraph("2.3  No menu que abriu, clique em <b>\"Download ZIP\"</b>.", corpo),
    Spacer(1, 4),
    Paragraph("2.4  Espere o arquivo ZIP ser baixado. Ele vai aparecer na sua "
              "pasta <b>Downloads</b>.", corpo),
    Spacer(1, 4),
    Paragraph("2.5  Clique duas vezes no arquivo ZIP para descompactar. "
              "Uma pasta chamada <b>PedCurve-main</b> sera criada.", corpo),
    Spacer(1, 4),
    caixa_dica("Mova a pasta PedCurve-main para um lugar facil de encontrar, "
               "como a sua Area de Trabalho (Desktop)."),
]))
historia.append(Spacer(1, 10))

# ── Passo 3 ───────────────────────────────────────────────────────────────────
historia.append(caixa_passo(3, "Abra o Terminal do Mac", [
    Paragraph("O Terminal e uma janela de texto que usamos para dar instrucoes ao computador. "
              "Parece intimidador, mas voce so vai digitar um comando simples.", corpo),
    Spacer(1, 4),
    Paragraph("Existem duas formas de abrir o Terminal:", corpo_bold),
    Spacer(1, 4),
    Paragraph("<b>Opcao A (mais facil):</b>  Pressione as teclas <b>Command (cmd) + Barra de Espaco</b> "
              "para abrir o Spotlight. Digite <b>Terminal</b> e pressione <b>Enter</b>.", corpo),
    Spacer(1, 6),
    Paragraph("<b>Opcao B:</b>  Abra o <b>Finder</b>, va em <b>Aplicativos &gt; Utilitarios</b> "
              "e clique duas vezes em <b>Terminal</b>.", corpo),
    Spacer(1, 4),
    caixa_dica("Uma janela preta ou branca vai abrir com um cursor piscando. E isso mesmo!"),
]))
historia.append(Spacer(1, 10))

# ── Passo 4 ───────────────────────────────────────────────────────────────────
historia.append(caixa_passo(4, "Va ate a pasta do aplicativo pelo Terminal", [
    Paragraph("Agora precisamos dizer ao Terminal onde esta a pasta do PedCurve.", corpo),
    Spacer(1, 4),
    Paragraph("4.1  No Terminal, digite <b>cd</b> seguido de um espaco (nao pressione Enter ainda):", corpo_bold),
    caixa_codigo("cd "),
    Spacer(1, 6),
    Paragraph("4.2  Agora arraste a pasta <b>PedCurve-main</b> diretamente para dentro "
              "da janela do Terminal. O caminho vai aparecer automaticamente!", corpo),
    Spacer(1, 6),
    Paragraph("4.3  Pressione <b>Enter</b>.", corpo),
    Spacer(1, 4),
    caixa_aviso("Nao feche o Terminal enquanto o aplicativo estiver rodando."),
]))
historia.append(Spacer(1, 10))

# ── Passo 5 ───────────────────────────────────────────────────────────────────
historia.append(caixa_passo(5, "Permita a execucao e rode o aplicativo", [
    Paragraph("Na primeira vez, e necessario dar permissao para o script rodar no Mac. "
              "Isso so precisa ser feito uma unica vez.", corpo),
    Spacer(1, 4),
    Paragraph("5.1  No Terminal, copie e cole o comando abaixo e pressione <b>Enter</b>:", corpo_bold),
    caixa_codigo("chmod +x run.sh"),
    Spacer(1, 8),
    Paragraph("5.2  Agora rode o aplicativo com o comando abaixo e pressione <b>Enter</b>:", corpo_bold),
    caixa_codigo("./run.sh"),
    Spacer(1, 6),
    Paragraph("O terminal vai trabalhar por alguns segundos e, em seguida, o PedCurve "
              "abrira automaticamente no seu navegador!", corpo),
    Spacer(1, 4),
    caixa_dica("Da segunda vez em diante, basta abrir o Terminal, ir ate a pasta (Passo 4) "
               "e digitar ./run.sh. Os Passos 1 e 5.1 sao feitos apenas uma vez."),
]))
historia.append(Spacer(1, 10))

# ── Problemas comuns ──────────────────────────────────────────────────────────
historia.append(HRFlowable(width=W, thickness=1, color=AZUL_BORDA, spaceBefore=4, spaceAfter=10))
historia.append(Paragraph("Problemas comuns e solucoes", secao))

problemas = [
    ["Problema", "O que fazer"],
    ['"command not found: node"',
     'O Node.js nao foi instalado corretamente.\nRepita o Passo 1.'],
    ['"Permission denied"',
     'Voce pulou o Passo 5.1.\nDigite chmod +x run.sh e tente novamente.'],
    ['O navegador abriu mas a pagina\nnao carregou',
     'Aguarde 10 segundos e atualize\na pagina (Command + R).'],
    ['O Terminal fechou sozinho',
     'Reabra o Terminal e repita\na partir do Passo 4.'],
]

t_prob = Table(problemas, colWidths=[W * 0.42, W * 0.58])
t_prob.setStyle(TableStyle([
    ("BACKGROUND",   (0,0), (-1,0),  AZUL_PASSO),
    ("TEXTCOLOR",    (0,0), (-1,0),  BRANCO),
    ("FONTNAME",     (0,0), (-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",     (0,0), (-1,-1), 9.5),
    ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
    ("TEXTCOLOR",    (0,1), (-1,-1), CINZA_TEXTO),
    ("ROWBACKGROUNDS",(0,1),(-1,-1), [CINZA_FUNDO, BRANCO]),
    ("GRID",         (0,0), (-1,-1), 0.5, AZUL_BORDA),
    ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING",  (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING",   (0,0), (-1,-1), 7),
    ("BOTTOMPADDING",(0,0), (-1,-1), 7),
]))
historia.append(t_prob)
historia.append(Spacer(1, 16))

# ── Rodapé ────────────────────────────────────────────────────────────────────
historia.append(HRFlowable(width=W, thickness=1, color=AZUL_BORDA, spaceAfter=8))
historia.append(Paragraph(
    "PedCurve  |  github.com/Gabriel-Letro/PedCurve  |  Guia gerado automaticamente",
    rodape_estilo))

# ── Gera o PDF ────────────────────────────────────────────────────────────────
doc.build(historia)
print(f"PDF gerado: {OUTPUT}")
