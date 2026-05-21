@echo off
chcp 65001 >nul
echo ============================================
echo   PedCurve - Commit e Push para o GitHub
echo ============================================
echo.

cd /d "%~dp0"

REM Remove pasta .git corrompida se existir
if exist ".git" (
    echo Removendo repositorio git anterior...
    rmdir /s /q .git
)

REM Inicializa git
echo Inicializando repositorio git...
git init
git branch -m main

REM Configura usuario
git config user.name "Camila"
git config user.email "camilatozati37@gmail.com"

REM Adiciona remote com token de autenticacao
echo Conectando ao GitHub...
git remote add origin https://***REMOVED***@github.com/Gabriel-Letro/PedCurve.git

REM Adiciona todos os arquivos (respeitando .gitignore)
echo Adicionando arquivos...
git add .

REM Mostra o que sera commitado
echo.
echo Arquivos que serao commitados:
git status --short

echo.

REM Faz o commit
echo Fazendo commit...
git commit -m "feat: adiciona app PedCurve completo

- Paginas: Home, Login, ParentLogin, Dashboard, PatientProfile
- Componentes: GrowthChart, ConsultationTimeline, PrintReport, Logo
- Contexto global (AppContext)
- Dados de curvas de crescimento OMS/CDC (peso, altura, IMC, PC)
- Utilitarios de calculo de z-score e padroes de curvas
- Configuracao Vite + React + TypeScript"

REM Push para o GitHub
echo.
echo Enviando para o GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% == 0 (
    echo ============================================
    echo   SUCESSO! Codigo enviado para o GitHub!
    echo   https://github.com/Gabriel-Letro/PedCurve
    echo ============================================
) else (
    echo ============================================
    echo   ERRO no push. Verifique a mensagem acima.
    echo ============================================
)

pause
