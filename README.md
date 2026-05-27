<div align="center">

<img src="https://img.shields.io/badge/PedCurve-v0.0.0-4CAF50?style=for-the-badge&logo=react&logoColor=white" alt="PedCurve"/>

# 👶 PedCurve
### Aplicativo de Acompanhamento de Crescimento Infantil

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/Licença-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=flat-square)]()

</div>

---

## 📋 Sobre o Projeto

O **PedCurve** é uma aplicação web moderna e interativa voltada ao acompanhamento do crescimento físico e desenvolvimento de crianças. Desenvolvido para atender tanto **profissionais de saúde** (pediatras, nutricionistas) quanto **pais e responsáveis**, o sistema permite registrar consultas, calcular indicadores clínicos e visualizar a evolução da criança com gráficos baseados nas curvas oficiais da **OMS** e do **CDC**.

> 💡 O nome **PedCurve** une *Pediatria* + *Curva de Crescimento* — refletindo exatamente o propósito do projeto.

---

## ✨ Funcionalidades

- **📁 Cadastro de Pacientes** — Registra crianças e gera um código de acesso exclusivo e simples para os pais (ex: `MARIA1`, `JOAO22`)
- **📋 Registro de Consultas** — Armazena peso (kg), altura/estatura (cm) e perímetro cefálico (cm) por consulta
- **📐 Cálculo Clínico Automático** — Calcula IMC, percentis e **Escore-Z** com base nas tabelas oficiais da OMS e CDC
- **📈 Gráficos de Crescimento** — Exibe curvas de crescimento interativas para acompanhar a evolução ao longo do tempo
- **🖨️ Impressão de Relatórios** — Gera relatórios prontos para impressão ou exportação em PDF
- **👨‍👩‍👧 Portal dos Pais** — Pais visualizam os gráficos do filho apenas digitando o código de acesso, sem cadastro

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [React](https://react.dev/) | 19 | Interface do usuário |
| [TypeScript](https://www.typescriptlang.org/) | 6.0 | Tipagem estática |
| [Vite](https://vitejs.dev/) | 8.0 | Build e servidor de desenvolvimento |
| [Recharts](https://recharts.org/) | 3.x | Gráficos de crescimento interativos |
| [React Router DOM](https://reactrouter.com/) | 7.x | Roteamento de páginas |
| [date-fns](https://date-fns.org/) | 4.x | Manipulação de datas |
| [QRCode.react](https://github.com/zpao/qrcode.react) | 4.x | Geração de QR Code para acesso dos pais |
| [UUID](https://github.com/uuidjs/uuid) | 14.x | Geração de identificadores únicos |
| [Lucide React](https://lucide.dev/) | 1.x | Ícones |
| [Python](https://www.python.org/) | 3.x | Script auxiliar de geração de guia (`gerar_guia.py`) |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado (versão LTS recomendada)
- npm (incluído com o Node.js)

### Passo a passo

**1. Clone o repositório:**
```bash
git clone https://github.com/Gabriel-Letro/PedCurve.git
cd PedCurve
```

**2. Instale as dependências:**
```bash
npm install
```

**3. Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

**4. Acesse no navegador:**
```
http://localhost:5173
```

---

### ⚡ Inicialização Rápida (Windows)

Dê um duplo clique no arquivo `run.bat` na raiz do projeto. Ele instala as dependências, inicia o servidor e abre o aplicativo automaticamente no navegador.

### 🐧 Linux / macOS

```bash
chmod +x run.sh
./run.sh
```

---

## 📁 Estrutura do Projeto

```
PedCurve/
├── public/              # Arquivos estáticos públicos
├── src/                 # Código-fonte principal
│   ├── components/      # Componentes React reutilizáveis
│   ├── pages/           # Páginas da aplicação
│   ├── hooks/           # Custom hooks
│   └── utils/           # Funções utilitárias (cálculo de percentis, Escore-Z, etc.)
├── gerar_guia.py        # Script Python auxiliar
├── index.html           # HTML principal
├── vite.config.ts       # Configuração do Vite
├── tsconfig.json        # Configuração do TypeScript
├── run.bat              # Script de inicialização (Windows)
├── run.sh               # Script de inicialização (Linux/macOS)
└── package.json         # Dependências e scripts
```

---

## 📊 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run lint` | Verifica erros de lint no código |

---

## 👥 Público-Alvo

- 🩺 **Pediatras e nutricionistas** — para registro e acompanhamento clínico de pacientes
- 👪 **Pais e responsáveis** — para acompanhar o desenvolvimento do filho de forma simples e visual

---

## 📌 Roadmap

- [x] Cadastro de pacientes com código de acesso
- [x] Registro de consultas (peso, altura, perímetro cefálico)
- [x] Cálculo automático de IMC, percentis e Escore-Z (OMS/CDC)
- [x] Gráficos de crescimento interativos
- [x] Portal dos pais com acesso por código
- [x] Impressão de relatórios em PDF
- [ ] Suporte offline (PWA)
- [ ] Exportação de dados em CSV/Excel
- [ ] Histórico de múltiplos pacientes por profissional
- [ ] Alertas automáticos de desvios de crescimento

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma _issue_ ou enviar um _pull request_.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça commit das suas alterações (`git commit -m 'feat: adiciona minha feature'`)
4. Faça push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 👨‍💻 Autor

Desenvolvido por **Gabriel Letro Tozati**

[![GitHub](https://img.shields.io/badge/GitHub-Gabriel--Letro-181717?style=flat-square&logo=github)](https://github.com/Gabriel-Letro)

---

<div align="center">

Feito com ❤️ para a saúde infantil 👶

</div>
