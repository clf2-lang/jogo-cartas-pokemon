import random

# Tabela de vantagens de tipo: chave ataca, valor é o tipo que sofre dano extra
VANTAGENS = {
    "Fogo": "Planta",
    "Agua": "Fogo",
    "Planta": "Agua",
    "Eletrico": "Agua",
    "Psiquico": "Lutador",
    "Lutador": "Normal",
}

class PedraEvolucao:
    """Representa um item de evolução que pode ser usado em cartas de Pokémon."""
    def __init__(self, tipo_elemento):
        self.tipo = tipo_elemento
        self.nome = f"Pedra {tipo_elemento}"

class Pocao:
    """Item de cura que restaura HP de uma carta ativa."""
    def __init__(self, quantidade=30):
        self.quantidade = quantidade
        self.nome = f"Poção ({quantidade} HP)"

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

    def curar(self, quantidade):
        """Restaura HP até o máximo."""
        recuperado = min(quantidade, self.hp_max - self.hp)
        self.hp += recuperado
        print(f"💚 {self.nome} recuperou {recuperado} HP! HP atual: {self.hp}/{self.hp_max}")

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
        Aplica multiplicador de 1.5× quando há vantagem de tipo.
        """
        dano_base = self.ataque - (oponente.defesa * 0.5)

        # Verifica vantagem de tipo antes de aplicar o mínimo
        if VANTAGENS.get(self.elemento) == oponente.elemento:
            print(f"🔥 Vantagem de tipo! {self.elemento} é eficaz contra {oponente.elemento}!")
            dano_base *= 1.5

        dano_final = int(max(dano_base, 10))  # Garante no mínimo 10 de dano

        print(f"⚔️ {self.nome} usa seu poder em {oponente.nome}!")
        oponente.receber_dano(dano_final)

class Jogador:
    """Representa um jogador com um deck de cartas e itens."""
    def __init__(self, nome):
        self.nome = nome
        self.mao = []
        self.itens = []
        self.cartas_vencidas = 0

    def adicionar_carta(self, carta):
        self.mao.append(carta)

    def adicionar_item(self, item):
        self.itens.append(item)

    def tem_cartas(self):
        return len(self.mao) > 0

    def rolar_dado(self):
        resultado = random.randint(1, 6)
        print(f"🎲 {self.nome} rolou o dado e tirou: {resultado}")
        return resultado

    def jogar_carta(self):
        """Retorna a primeira carta ainda viva da mão."""
        for carta in self.mao:
            if carta.esta_vivo():
                return carta
        return None

    def remover_carta_derrotada(self, carta):
        """Remove uma carta derrotada da mão."""
        if carta in self.mao:
            self.mao.remove(carta)
            print(f"💀 {carta.nome} foi eliminado e removido da mão de {self.nome}!")

    def usar_item(self, carta):
        """Usa o primeiro item disponível na carta ativa."""
        if self.itens:
            item = self.itens.pop(0)
            print(f"\n🎒 {self.nome} usa {item.nome}...")
            if isinstance(item, PedraEvolucao):
                carta.evoluir(item)
            elif isinstance(item, Pocao):
                carta.curar(item.quantidade)

    def mostrar_estado(self):
        """Exibe um resumo do estado atual do jogador."""
        itens_str = ", ".join(i.nome for i in self.itens) if self.itens else "nenhum"
        print(f"\n📋 {self.nome} | Cartas: {len(self.mao)} | Itens: {itens_str} | Capturas: {self.cartas_vencidas}")
        for carta in self.mao:
            status = "✅" if carta.esta_vivo() else "💀"
            evoluido = " [EVOLUÍDO]" if carta.evoluido else ""
            print(f"  {status} {carta.nome}{evoluido} | HP: {carta.hp}/{carta.hp_max} | ATK: {carta.ataque} | DEF: {carta.defesa}")

class Jogo:
    """Gerencia o fluxo da partida, turnos e regras."""
    def __init__(self, jogador1, jogador2):
        self.jogadores = [jogador1, jogador2]
        self.turno_atual = 0
        self.rodada = 0

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
        """Executa um turno de batalha completo."""
        self.rodada += 1
        atacante = self.jogadores[self.turno_atual]
        defensor = self.jogadores[(self.turno_atual + 1) % 2]

        carta_atacante = atacante.jogar_carta()
        carta_defensor = defensor.jogar_carta()

        if not carta_atacante or not carta_defensor:
            print("Um dos jogadores não tem cartas!")
            return

        print(f"\n{'='*50}")
        print(f"  ⚔️  RODADA {self.rodada} — TURNO DE {atacante.nome.upper()}")
        print(f"{'='*50}")
        print(f"  🎴 {atacante.nome}: {carta_atacante.nome} (ATK {carta_atacante.ataque} | HP {carta_atacante.hp}/{carta_atacante.hp_max})")
        print(f"  🛡️  {defensor.nome}: {carta_defensor.nome} (DEF {carta_defensor.defesa} | HP {carta_defensor.hp}/{carta_defensor.hp_max})")

        # Uso de item antes do ataque
        if atacante.itens:
            atacante.usar_item(carta_atacante)

        # Lógica de Duelo
        if carta_atacante.ataque > carta_defensor.defesa:
            print("\n💥 O ataque superou a defesa!")
            carta_atacante.lancar_poder(carta_defensor)
        else:
            print("\n🛡️ O ataque foi bloqueado pela defesa!")

        # Verifica se o defensor foi derrotado
        if not carta_defensor.esta_vivo():
            print(f"\n🏆 {atacante.nome} derrubou {carta_defensor.nome}!")
            defensor.remover_carta_derrotada(carta_defensor)
            atacante.cartas_vencidas += 1
        else:
            print(f"\n🔄 {carta_defensor.nome} ainda está de pé!")

    def verificar_vencedor(self):
        """Retorna o vencedor se um jogador ficar sem cartas, senão None."""
        for i, jogador in enumerate(self.jogadores):
            if not jogador.tem_cartas():
                return self.jogadores[(i + 1) % 2]
        return None

    def jogar(self):
        """Loop principal do jogo."""
        print("\n" + "="*50)
        print("  🎮 BEM-VINDO AO JOGO DE CARTAS POKÉMON!")
        print("="*50)

        self.definir_inicio()

        print("\n--- 📋 ESTADO INICIAL ---")
        for jogador in self.jogadores:
            jogador.mostrar_estado()

        while True:
            vencedor = self.verificar_vencedor()
            if vencedor:
                break

            self.batalhar()

            print("\n--- 📋 ESTADO ATUAL ---")
            for jogador in self.jogadores:
                jogador.mostrar_estado()

            self.proximo_turno()

        print(f"\n{'='*50}")
        print(f"  🎉 FIM DE JOGO! {vencedor.nome.upper()} VENCEU")
        print(f"  🏅 Capturas: {vencedor.cartas_vencidas} carta(s) eliminada(s)")
        print(f"{'='*50}")

# --- EXEMPLO DE EXECUÇÃO ---
if __name__ == "__main__":
    # Criando Jogadores
    ash = Jogador("Ash")
    gary = Jogador("Gary")

    # Criando Cartas para Ash
    pikachu = CartaPokemon("Pikachu", "Eletrico", hp=100, ataque=80, defesa=40)
    charizard = CartaPokemon("Charizard", "Fogo", hp=130, ataque=90, defesa=55)
    bulbasaur = CartaPokemon("Bulbasaur", "Planta", hp=90, ataque=65, defesa=60)

    # Criando Cartas para Gary
    eevee = CartaPokemon("Eevee", "Normal", hp=110, ataque=70, defesa=50)
    gyarados = CartaPokemon("Gyarados", "Agua", hp=140, ataque=85, defesa=60)
    machop = CartaPokemon("Machop", "Lutador", hp=100, ataque=75, defesa=45)

    # Distribuindo Cartas
    ash.adicionar_carta(pikachu)
    ash.adicionar_carta(charizard)
    ash.adicionar_carta(bulbasaur)

    gary.adicionar_carta(eevee)
    gary.adicionar_carta(gyarados)
    gary.adicionar_carta(machop)

    # Adicionando itens
    ash.adicionar_item(PedraEvolucao("Eletrico"))
    ash.adicionar_item(Pocao(30))

    gary.adicionar_item(Pocao(40))
    gary.adicionar_item(PedraEvolucao("Agua"))

    # Iniciando o Jogo
    jogo = Jogo(ash, gary)
    jogo.jogar()