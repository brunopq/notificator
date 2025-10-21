# Notificador
Serviço de notificações utilizado para avisar clientes das audiências e perícias

## Quickstart
Para executar a aplicação, é necessário ter o `docker`, `bun` e o `node` instalados.

As variáveis de ambiente necessárias estão descritas no arquivo `.env.example`, apenas crie um arquivo `.env` com as mesmas variáveis e ajuste conforme a necessidade.
```bash
cp .env.example .env
```

Para executar o banco de dados, execute:
```bash
docker compose up -d # -d para rodar em segundo plano
```

Para executar a aplicação:
```bash
bun install # caso ainda não tenha sido instalado as dependências
bun dev
```

Caso seja necessário realizar alguma alteração no banco de dados, gere uma migração com:
```bash
bun generate
```
