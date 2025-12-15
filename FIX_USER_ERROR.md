# Guia Rápido: Resolver Erro ao Criar Usuário

## ❌ Erro Encontrado

```
ERROR: function auth.create_user() does not exist
```

## ✅ Solução

**NÃO use SQL** para criar usuários no Supabase Auth!

### Passo a Passo Correto:

1. **Abra seu projeto no Supabase Dashboard**
   - https://supabase.com
   - Faça login
   - Selecione seu projeto

2. **Vá em Authentication**
   - Menu lateral esquerdo
   - Clique em "Authentication"
   - Clique em "Users"

3. **Adicione Usuário**
   - Botão verde "Add user" (canto superior direito)
   - Selecione "Create new user"

4. **Preencha o Formulário**
   ```
   Email: admin@exemplo.com
   Password: SuaSenhaForte123!
   
   ✅ IMPORTANTE: Marque "Auto Confirm User"
   ```

5. **Crie**
   - Clique em "Create user"
   - Pronto! Usuário criado

## 🔐 Fazer Login no Admin

Depois de criar o usuário:

1. Abra: http://192.168.1.4:8080/admin.html
2. Email: admin@exemplo.com  
3. Senha: SuaSenhaForte123!
4. Clique em "Entrar"

## ✅ Teste

Se tudo funcionou, você verá o dashboard do admin com:
- 📊 Estatísticas
- 📢 Gerenciar Anúncios
- 🌐 Gerenciar Servidores
- ⚡ Resultados

## ❓ Problemas?

### "Invalid login credentials"
- ✅ Verifique se marcou "Auto Confirm User"
- ✅ Confira email/senha
- ✅ Tente resetar a senha pelo Dashboard

### "Supabase not configured"
- ✅ Verifique `supabase-config.js`
- ✅ Confirme que tem SUPABASE_URL e SUPABASE_ANON_KEY preenchidos
- ✅ Execute o script `database-migrations.sql`

### Ainda não funciona?
1. Abra o console do navegador (F12)
2. Veja os erros
3. Compartilhe a mensagem de erro
