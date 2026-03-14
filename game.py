import random

class PedraEvolucao:
    """Representa um item de evolução que pode ser usado em cartas de Pokémon."""
    def __init__(self, tipo_elemento):
        self.tipo = tipo_elemento

class CartaPokemon:
    """Representa uma carta individual de Pokémon com atributos de batalha."""
    def __init__(self, nome, elemento, hp, ataque, defesa):
        self.nome = nome
        self.elemento = elemento
        self.hp = hp
        self.hp_max = hp
        self.ataque = ataque
        self.defesa = defesa
        self.evoluido = False

    def esta_vivo(self):
        return self.hp > 0

    def receber_dano(self, dano):
        self.hp -= dano
        if self.hp < 0:
            self.hp = 0
        print(f"💔 {self.nome} recebeu {dano} de dano! HP restante: {self.hp}/{self.hp_max}")

    def evoluir(self, pedra):
        """
        Tenta evoluir o Pokémon se a pedra for compatível com o elemento.
        Aumenta atributos base e muda o nome.
        """
        if not self.evoluido and pedra.tipo == self.elemento:
            print(f"✨ A pedra {pedra.tipo} reage com {self.nome}!")
            self.nome = f"Mega {self.nome}"
            self.hp_max += 50
            self.hp = self.hp_max  # Recupera vida ao evoluir
            self.ataque += 20
            self.defesa += 15
            self.evoluido = True
            print(f"🚀 {self.nome} evoluiu! Novos status: ATK {self.ataque} / DEF {self.defesa}")
            return True
        elif self.evoluido:
            print(f"⚠️ {self.nome} já atingiu sua forma máxima!")
        else:
            print(f"❌ A pedra {pedra.tipo} não funciona em {self.nome} ({self.elemento}).")
        return False

    def lancar_poder(self, oponente):
        """
        Calcula o dano baseado na diferença entre ataque e defesa.
        """
        dano_base = self.ataque - (oponente.defesa * 0.5)
        dano_final = int(max(dano_base, 10))  # Garante no mínimo 10 de dano
        print(f"⚔️ {self.nome} usa seu poder em {oponente.nome}!")
        oponente.receber_dano(dano_final)

class Jogador:
    """Representa um jogador com um deck de cartas e itens."""
    def __init__(self, nome):
        self.nome = nome
        self.mao = []
        self.itens = []

    def adicionar_carta(self, carta):
        self.mao.append(carta)

    def adicionar_item(self, item):
        self.itens.append(item)

    def rolar_dado(self):
        resultado = random.randint(1, 6)
        print(f"🎲 {self.nome} rolou o dado e tirou: {resultado}")
        return resultado

    def jogar_carta(self):
        if self.mao:
            return self.mao[0]  # Simplificação: joga a primeira carta
        return None

class Jogo:
    """Gerencia o fluxo da partida, turnos e regras."""
    def __init__(self, jogador1, jogador2):
        self.jogadores = [jogador1, jogador2]
        self.turno_atual = 0

    def definir_inicio(self):
        """
        Define quem começa o jogo rolando dados.
        O jogador com o maior número inicia.
        """
        print("\n--- 🎲 DECIDINDO QUEM COMEÇA ---")
        rolagem_j1 = self.jogadores[0].rolar_dado()
        rolagem_j2 = self.jogadores[1].rolar_dado()

        if rolagem_j1 > rolagem_j2:
            print(f"✅ {self.jogadores[0].nome} começa!")
            self.turno_atual = 0
        elif rolagem_j2 > rolagem_j1:
            print(f"✅ {self.jogadores[1].nome} começa!")
            self.turno_atual = 1
        else:
            print("Empate! Rolando novamente...")
            self.definir_inicio()

    def proximo_turno(self):
        # Alterna entre 0 e 1 (Sentido horário para 2 jogadores)
        self.turno_atual = (self.turno_atual + 1) % 2

    def batalhar(self):
        atacante = self.jogadores[self.turno_atual]
        defensor = self.jogadores[(self.turno_atual + 1) % 2]

        carta_atacante = atacante.jogar_carta()
        carta_defensor = defensor.jogar_carta()

        if not carta_atacante or not carta_defensor:
            print("Um dos jogadores não tem cartas!")
            return

        print(f"\n--- ⚔️ TURNO DE {atacante.nome.upper()} ---")
        print(f"{atacante.nome} joga {carta_atacante.nome} (ATK {carta_atacante.ataque})")
        print(f"{defensor.nome} defende com {carta_defensor.nome} (DEF {carta_defensor.defesa})")

        # Exemplo de uso de item (Evolução) antes do ataque
        if atacante.itens:
            item = atacante.itens.pop(0) # Usa o primeiro item
            print(f"\n🎒 {atacante.nome} usa um item antes de atacar...")
            carta_atacante.evoluir(item)

        # Lógica de Duelo
        if carta_atacante.ataque > carta_defensor.defesa:
            print("💥 O ataque superou a defesa!")
            carta_atacante.lancar_poder(carta_defensor)
        else:
            print("🛡️ O ataque foi bloqueado pela defesa!")

        # Verifica se o defensor foi derrotado
        if not carta_defensor.esta_vivo():
            print(f"\n🏆 {atacante.nome} venceu o duelo!")
        else:
            print(f"\n🔄 Fim do turno. {carta_defensor.nome} ainda está de pé.")

# --- EXEMPLO DE EXECUÇÃO ---
if __name__ == "__main__":
    # Criando Jogadores
    ash = Jogador("Ash")
    gary = Jogador("Gary")

    # Criando Cartas
    pikachu = CartaPokemon("Pikachu", "Eletrico", hp=100, ataque=80, defesa=40)
    eevee = CartaPokemon("Eevee", "Normal", hp=110, ataque=70, defesa=50)

    # Distribuindo Cartas
    ash.adicionar_carta(pikachu)
    gary.adicionar_carta(eevee)

    # Adicionando Pedra de Evolução para o Ash
    pedra_trovao = PedraEvolucao("Eletrico")
    ash.adicionar_item(pedra_trovao)

    # Iniciando o Jogo
    jogo = Jogo(ash, gary)
    jogo.definir_inicio()
    jogo.batalhar()