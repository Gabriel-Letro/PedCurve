# 👶 PedCurve - Acompanhamento de Crescimento Infantil

O **PedCurve** é um aplicativo simples e interativo para acompanhar o crescimento físico e desenvolvimento de crianças. Ele foi criado tanto para profissionais de saúde (pediatras, nutricionistas) quanto para os pais/responsáveis.

---

## 🚀 O que o aplicativo faz?

* **Cadastro de Pacientes**: Permite registrar crianças e gerar um código de acesso exclusivo para os pais (ex: `MARIA1`, `JOAO22`).
* **Registro de Consultas**: Salva dados de peso (kg), altura/estatura (cm) e perímetro cefálico (cm) em cada consulta.
* **Cálculo Clínico Automático**: Calcula automaticamente o IMC da criança, os percentis e o **Escore-Z** com base nas tabelas oficiais da **OMS (Organização Mundial da Saúde)** e do **CDC**.
* **Gráficos de Crescimento**: Exibe curvas de crescimento interativas para acompanhar a evolução da criança ao longo do tempo.
* **Impressão de Relatórios**: Gera relatórios em formato amigável para impressão em PDF.
* **Portal dos Pais**: Permite que os pais visualizem os gráficos de seus filhos apenas digitando o código de acesso, sem precisar de senha ou cadastro complexo.

---

## 💻 Como rodar o aplicativo

1. **Instale as dependências** (necessário ter o Node.js instalado):
   ```bash
   npm install
   ```

2. **Inicie o aplicativo**:
   ```bash
   npm run dev
   ```

3. **Inicialização rápida no Windows**:
   Basta dar um duplo clique no arquivo `run.bat` na pasta raiz do projeto. Ele vai abrir o servidor e o aplicativo no seu navegador automaticamente.
