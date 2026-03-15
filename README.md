# 🎮 Pokémon TCG – Jogo de Cartas

Jogo de cartas Pokémon interativo com interface web bonita, animações e batalhas com IA.

## ▶️ Como rodar (versão web)

Basta abrir o arquivo `index.html` no navegador — **nenhuma instalação necessária**!

```bash
# Opção 1: abrir diretamente
# Abra o arquivo index.html no seu navegador (Chrome, Firefox, Edge…)

# Opção 2: servidor local (para evitar restrições de CORS em alguns navegadores)
python3 -m http.server 8080
# Depois acesse: http://localhost:8080
```

> **Nota:** As imagens dos Pokémon são carregadas da
> [PokeAPI](https://raw.githubusercontent.com/PokeAPI/sprites/) — é necessário
> conexão com a internet para exibi-las.

## 🕹️ Como jogar

1. Clique em **▶ Iniciar Jogo**
2. O jogo rola dados para definir quem começa
3. **Selecione uma carta** da sua mão clicando nela (clique duas vezes para confirmá-la)
4. Opcionalmente, **selecione uma pedra de evolução** e clique em **✨ Usar Pedra**
   - A pedra deve ser compatível com o elemento do seu Pokémon ativo
5. Clique em **⚔️ Atacar!** para atacar o Pokémon da CPU
6. Continue até um dos lados ficar sem cartas

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 🖼️ Imagens oficiais | Sprites da PokeAPI (official artwork) |
| 🃏 Deck de 12 cartas | Baralho embaralhado, mão visível |
| 💎 Pedras de evolução | 7 tipos diferentes (Trovão, Fogo, Água…) |
| 🤖 CPU com IA | CPU joga automaticamente com lógica de decisão |
| 💥 Animações | Shake no dano, flash de tela, número de dano flutuante |
| ✨ Evolução | Pokémon evolui com bônus de stats e sprite atualizado |
| 📜 Log de batalha | Histórico em tempo real de todas as ações |
| 🎲 Rolagem de dados | Define quem começa a partida |

## ⚙️ Mecânicas de batalha

- **Dano** = `ATK do atacante − (DEF do defensor × 0.5)`, mínimo 10
- **Evolução**: +50 HP (restaurado por completo), +20 ATK, +15 DEF
- Quando um Pokémon é derrotado, o jogador deve escolher uma nova carta da mão
- Quem ficar sem cartas e sem Pokémon ativo perde a partida

## 🐍 Versão Python original

```bash
python3 game.py
```

## 📂 Estrutura do projeto

```
index.html   # Interface web do jogo
style.css    # Design responsivo (tema Pokémon TCG)
script.js    # Lógica do jogo + integração PokeAPI
game.py      # Versão original em Python (terminal)
README.md    # Este arquivo
```
