# Medidor de Velocidade - Speed Test Premium

Aplicação web premium para medição de velocidade de internet com banco de dados Supabase, interface administrativa e áreas para anúncios.

## 🚀 Funcionalidades

- ✅ Teste de velocidade (Download, Upload, Ping)
- ✅ Servidores configuráveis (Cloudflare, Google CDN padrão)
- ✅ Design premium com glassmorphism e animações
- ✅ Totalmente responsivo (mobile, tablet, desktop)
- ✅ Integração com Supabase para persistência de dados
- ✅ Interface administrativa completa
- ✅ Gestão de anúncios dinâmicos
- ✅ Analytics de testes realizados

## 📋 Pré-requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Servidor HTTP local (http-server, Live Server, etc.)

## 🔧 Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: Medidor Velocidade
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima
5. Aguarde a criação do projeto (1-2 minutos)

### Passo 2: Executar o Script de Migração

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `database-migrations.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar
6. Você verá a mensagem de sucesso: ✅ Database schema created successfully!

### Passo 3: Criar Usuário Admin

1. No painel do Supabase, vá em **Authentication > Users**
2. Clique em "Add user"
3. Escolha "Create new user"
4. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: senha-segura
   - **Auto Confirm User**: ✅ Marque para confirmar automaticamente
5. Clique em "Create user"

### Passo 4: Copiar Credenciais

1. No painel do Supabase, vá em **Project Settings > API**
2 Copie as seguintes informações:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public** key (a chave mais longa)

### Passo 5: Configurar a Aplicação

1. Abra o arquivo `supabase-config.js`
2. Localize as linhas:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```
3. Substitua pelos seus valores:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...sua-chave-aqui...';
```
4. Salve o arquivo

## 🖥️ Rodando a Aplicação

### Opção 1: http-server (Node.js)

```bash
# Instalar http-server globalmente (somente uma vez)
npm install -g http-server

# Rodar o servidor
cd c:\projetos\medir_velocidade_internet
http-server -p 8080
```

Acesse: http://localhost:8080

### Opção 2: Live Server (VS Code)

1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

### Opção 3: Python

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

## 🔐 Acessando o Admin

1. Abra http://localhost:8080/admin.html
2. Faça login com o usuário criado no Supabase
3. Você terá acesso a:
   - 📊 **Dashboard**: Estatísticas de testes
   - 📢 **Anúncios**: Gerenciar anúncios (criar, editar, excluir)
   - 🌐 **Servidores**: Gerenciar servidores de teste
   - ⚡ **Resultados**: Visualizar todos os testes realizados

## 📝 Estrutura de Arquivos

```
medir_velocidade_internet/
├── index.html              # Página principal do medidor
├── admin.html              # Interface administrativa
├── styles.css              # Estilos da aplicação
├── admin.css               # Estilos do admin
├── script.js               # Lógica do medidor
├── admin.js                # Lógica do admin
├── supabase-config.js      # Configuração do Supabase
├── database-migrations.sql # Script de criação do banco
├── .env.example            # Exemplo de variáveis de ambiente
└── README.md               # Este arquivo
```

## 🎨 Gerenciando Anúncios

### Criar Novo Anúncio

1. Acesse o admin e vá em "Anúncios"
2. Clique em "+ Novo Anúncio"
3. Preencha:
   - Título: Nome interno do anúncio
   - Posição: Banner Topo (728x90) ou Sidebar (160x600)
   - Conteúdo HTML: Código HTML personalizado
   - OU URL da Imagem: Link para imagem
   - URL de Destino: Link ao clicar (opcional)
   - Prioridade: Maior valor = maior prioridade
   - Datas: Início/Fim (opcional)
   - Ativo: Marque para exibir

### Exemplo de Anúncio HTML

```html
<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
    <h3>🚀 Seu Anúncio Aqui!</h3>
    <p>Fale com milhares de visitantes</p>
    <a href="https://seusite.com" style="color: white; text-decoration: underline;">Saiba mais</a>
</div>
```

## 🌐 Adicionando Servidores de Teste

1. Acesse o admin e vá em "Servidores"
2. Clique em "+ Novo Servidor"
3. Preencha:
   - Nome: Nome do servidor
   - URLs de Download: Array JSON com URLs
   - URL de Upload: Endpoint que aceita POST
   - URL de Ping: URL para teste de latência
   - Servidor Padrão: Marque para aparecer como opção padrão
   - Ativo: Marque para habilitar

### Exemplo de JSON para URLs

```json
[
  "https://servidor.com/arquivo1.bin",
  "https://servidor.com/arquivo2.bin"
]
```

## 📊 Analytics

O dashboard mostra:
- Total de testes realizados
- Velocidade média de download
- Velocidade média de upload
- Ping médio
- Testes recentes

Todos os dados são salvos automaticamente no banco de dados.

## 🐛 Solução de Problemas

### Anúncios não aparecem
- Verifique se o Supabase está configurado corretamente
- Confirme que existe pelo menos um anúncio ativo
- Verifique o console do navegador (F12) para erros

### Upload mostra "N/A"
- Normal! Muitos servidores CDN não aceitam upload por questões de segurança
- Configure um servidor personalizado com endpoint de upload

### Erro "Supabase not configured"
- Verifique se as credenciais em `supabase-config.js` estão corretas
- Confirme que o script de migração foi executado

### Erro ao fazer login no admin
- Confirme que o usuário foi criado no Supabase Auth
- Verifique se o email/senha estão corretos
- Tente resetar a senha pelo painel do Supabase

## 📱 Responsividade

A aplicação é totalmente responsiva:
- **Mobile** (< 768px): Layout single column
- **Tablet** (768px - 1199px): Layout otimizado
- **Desktop** (>= 1200px): Layout completo com sidebar

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Anúncios e servidores ativos são públicos (leitura)
- Admin CRUD requer autenticação
- Resultados de testes são públicos

## 🚀 Próximos Passos

- [ ] Exportar resultados para CSV
- [ ] Gráficos de evolução de velocidade
- [ ] Notificações em tempo real
- [ ] Upload de imagens de anúncios para Supabase Storage
- [ ] API pública para acesso aos dados

## 📄 Licença

Este projeto é fornecido como está, sem garantias. Sinta-se livre para modificar e usar conforme necessário.

---

**Desenvolvido com ❤️ usando HTML, CSS, JavaScript e Supabase**
