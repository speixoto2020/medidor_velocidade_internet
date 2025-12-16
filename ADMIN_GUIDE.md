# Guia Rápido: Acesso ao Admin Panel

## 🔐 Como Criar Usuário Admin

O admin panel usa **Supabase Auth** para autenticação.

### ✅ Método Correto: Dashboard Supabase

1. **Acesse seu projeto Supabase**
   - Vá em https://supabase.com
   - Faça login e selecione seu projeto

2. **Navegue até Authentication**
   - No menu lateral, clique em **Authentication**
   - Clique em **Users**

3. **Adicione um novo usuário**
   - Clique no botão **Add user**
   - Selecione **Create new user**

4. **Preencha os dados**
   ```
   Email: admin@exemplo.com
   Password: SuaSenhaSegura123!
   Auto Confirm User: ✅ (IMPORTANTE: marque esta opção!)
   ```

5. **Clique em Create user**

> **⚠️ Importante:** Não use SQL para criar usuários. Use sempre o Dashboard do Supabase.

## 🚀 Acessando o Admin Panel

1. **Abra o Admin**
   - URL: http://192.168.1.4:8080/admin.html
   - Ou: http://localhost:8080/admin.html

2. **Faça Login**
   - Email: O email que você criou no Supabase
   - Senha: A senha que você definiu
   - Clique em **Entrar**

3. **Pronto!**
   - Você será redirecionado para o dashboard
   - Terá acesso a todas as funcionalidades admin

## ❌ Problemas Comuns

### "Erro ao fazer login"
- ✅ Verifique se o email/senha estão corretos
- ✅ Confirme que o usuário foi criado no Supabase
- ✅ Verifique se marcou "Auto Confirm User"
- ✅ Confira se as credenciais em `supabase-config.js` estão corretas

### "Supabase not configured"
- ✅ Abra `supabase-config.js`
- ✅ Verifique se SUPABASE_URL e SUPABASE_ANON_KEY estão preenchidos
- ✅ Certifique-se de que não contém "YOUR_SUPABASE"

### Login não funciona
1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Procure por erros em vermelho
4. Se ver "auth/invalid-credentials", a senha está errada
5. Se ver "network error", verifique a URL do Supabase

## 🎯 Funcionalidades do Admin

Após o login, você terá acesso a:

### 📊 Dashboard
- Estatísticas de testes realizados
- Velocidade média (download, upload, ping)
- Testes recentes

### 📢 Anúncios
- Criar novos anúncios
- Editar anúncios existentes
- Ativar/desativar anúncios
- Excluir anúncios
- Controlar posição e prioridade

### 🌐 Servidores
- Adicionar servidores personalizados
- Editar configurações de servidores
- Ativar/desativar servidores
- Excluir servidores customizados
- Marcar servidores como padrão

### ⚡ Resultados
- Visualizar todos os testes
- Filtrar por data
- Exportar dados
- Excluir resultados

## 🔒 Segurança

- Apenas usuários autenticados podem acessar o admin
- Row Level Security (RLS) protege os dados
- Senhas são criptografadas pelo Supabase Auth
- Tokens de sessão são gerenciados automaticamente

## 💡 Dicas

1. **Primeira vez?**
   - Crie um usuário de teste primeiro
   - Teste o login antes de configurar tudo

2. **Esqueceu a senha?**
   - Vá no Supabase Dashboard > Authentication > Users
   - Clique no usuário e escolha "Change password"
   - Ou delete o usuário e crie um novo

3. **Múltiplos admins?**
   - Crie vários usuários no Supabase Auth
   - Todos terão acesso ao admin panel
   - Considere usar emails diferentes para cada admin

## ✅ Teste Rápido

```bash
# 1. Verifique se o servidor está rodando
# Deve mostrar: Server running at http://...

# 2. Abra o navegador
http://192.168.1.4:8080/admin.html

# 3. Tente fazer login
# Se funcionar, você verá o dashboard

# 4. Se não funcionar, abra o console (F12)
# Procure por mensagens de erro
```

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique o README.md completo
2. Confira a seção "Solução de Problemas"
3. Verifique os logs do console do navegador
4. Confirme que executou o script de migração no Supabase
