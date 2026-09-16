# StudyMate Mobile (React Native + Expo)

Bem-vindo à documentação do aplicativo mobile do **StudyMate**!

Este projeto foi construído utilizando **React Native** com o ecossistema **Expo** e TypeScript. Ele foi arquitetado para funcionar tanto como um aplicativo nativo (Android/iOS via Expo Go) quanto no navegador web através do `react-native-web` e em containers Docker.

---

## Como Executar o Projeto

### Opção 1: No Navegador (Modo Desenvolvimento)
Execute no terminal dentro da pasta `studymate-app/mobile`:
```bash
npm run web
```
O Metro bundler compilará a versão web e abrirá automaticamente em `http://localhost:8081`.

### Opção 2: No Celular Físico (Expo Go)
1. Instale o aplicativo **Expo Go** no seu smartphone (Google Play Store ou Apple App Store).
2. No computador, execute:
   ```bash
   npm start
   ```
3. Aponte a câmera do seu celular para o QR Code gerado no terminal.

### Opção 3: No Docker
Na raiz do repositório (`Study Mate/`):
```bash
docker compose up -d database backend mobile
```
Acesse a aplicação no navegador em `http://localhost:8082`.

---

## Guia Técnico para Iniciantes: Do React Web ao React Native

Se você já conhece **React para Web** (HTML, CSS e DOM), o **React Native** compartilha a mesma essência de componentes, estados (`useState`) e efeitos (`useEffect`). No entanto, a forma como os elementos são renderizados e processados muda drasticamente.

Abaixo estão as 6 diferenças principais, explicadas tecnicamente com exemplos práticos extraídos diretamente do nosso código:

---

### 1. Ausência de DOM vs. Primitivos Nativos

#### O Conceito:
Na web, o React manipula o *Virtual DOM* que é inserido no navegador como tags HTML (`<div>`, `<p>`, `<span>`, `<h1>`).
Em dispositivos móveis (celulares), **não existe DOM**. O React Native faz uma ponte com o sistema operacional para instanciar componentes visuais reais da plataforma:
- No Android: vira instâncias de `android.view.View` e `android.widget.TextView`.
- No iOS: vira instâncias de `UIView` e `UILabel`.

> **Regra Fundamental do React Native:** Todo e qualquer texto DEVE obrigatoriamente estar dentro de uma tag `<Text>`. Se você colocar texto solto dentro de uma `<View>`, o app travará com erro em tempo de execução.

#### Comparação de Código:

**No React Web (`studymate-app/frontend`):**
```tsx
// HTML tradicional
<div className="flex flex-col items-center">
  <h1 className="text-3xl font-bold text-primary">StudyMate</h1>
  <p className="text-muted-foreground">Organize sua vida acadêmica</p>
</div>
```

**No React Native Mobile (`studymate-app/mobile`):**
```tsx
// Primitivos nativos
<View style={styles.header}>
  <Text style={styles.appName}>StudyMate</Text>
  <Text style={styles.appSubtitle}>Organize sua vida acadêmica</Text>
</View>
```

---

### 2. Estilização: CSS Cascata vs. Motor Yoga (Flexbox Nativo)

#### O Conceito:
No React Web, o layout depende de arquivos `.css` ou classes Tailwind aplicadas ao motor de renderização do navegador (Chromium/Blink, Gecko, WebKit).
No React Native, não há motor CSS de navegador. O cálculo de posições é realizado por uma biblioteca em C++ criada pela Meta chamada **Yoga Engine**, que implementa Flexbox estrito.

#### Diferenças importantes:
- Toda `<View>` já nasce por padrão com `display: flex` e `flexDirection: column` (ao contrário da Web, onde o padrão é `row`).
- Propriedades com hífen do CSS tornam-se camelCase (`font-size` vira `fontSize`, `background-color` vira `backgroundColor`).
- Não existe suporte nativo a CSS Grid ou pseudoclasses como `:hover` (pois no celular não existe a seta do mouse pairando sobre a tela).

---

### 3. Eventos de Entrada: Cursor (Mouse) vs. Toque Capacitivo (Touch)

#### O Conceito:
Na Web, usamos o botão `<button onClick={...}>`. O navegador trata o clique de mouse sem se preocupar se o usuário estava rolando a página.
No celular, a tela é sensível ao toque. O sistema precisa discernir entre um toque rápido (clique intencional) e um gesto de arrastar o dedo para rolar a tela.

Por isso, utilizamos o componente `<Pressable>` com a propriedade `onPress`.

#### Comparação de Código:

**No React Web:**
```tsx
<button 
  onClick={() => navigate("/calendar")} 
  className="text-primary flex items-center"
>
  Ver todas
</button>
```

**No React Native:**
```tsx
<Pressable 
  onPress={() => navigation.navigate("CalendarTab")} 
  style={styles.seeAllButton}
>
  <Text style={styles.seeAllText}>Ver todas</Text>
  <ChevronRight size={16} color="#2563EB" />
</Pressable>
```

---

### 4. Rolagem de Telas: `overflow-y: auto` vs. `ScrollView` e `FlatList`

#### O Conceito:
Na Web, se um container tem 500 itens, aplicamos `overflow-y: auto` e o navegador renderiza todas as 500 `divs` no DOM sem grandes problemas de memória.
No celular, se você tentar renderizar centenas de elementos de uma vez, a memória RAM do smartphone esgota e o aplicativo fecha sozinho (*Crash*).

- `<ScrollView>`: Usado para telas de tamanho estático que precisam de rolagem simples.
- `<FlatList>`: Usado para coleções de dados (como listagem de disciplinas). O `FlatList` possui **reciclagem de células (virtualization)**: ele mantém na memória apenas os itens visíveis na tela, destruindo os itens que saíram da visão e recriando novos sob demanda conforme o usuário rola.

#### Comparação de Código:

**No React Web (`Subjects.tsx`):**
```tsx
<main className="h-full overflow-y-auto">
  {disciplinas.map((disciplina) => (
    <Card key={disciplina.idDisciplina}>
      <CardContent>
        <h3>{disciplina.nome}</h3>
      </CardContent>
    </Card>
  ))}
</main>
```

**No React Native (`SubjectsScreen.tsx`):**
```tsx
<FlatList
  data={disciplinas}
  keyExtractor={(item) => item.idDisciplina.toString()}
  renderItem={({ item }) => (
    <Card style={styles.subjectCard}>
      <Text style={styles.subjectTitle}>{item.nome}</Text>
    </Card>
  )}
  contentContainerStyle={styles.listContent}
/>
```

---

### 5. Roteamento: History API da Web vs. Pilhas de Navegação (Navigation Stacks)

#### O Conceito:
Na Web, usamos `react-router-dom`. Ao mudar de rota (`/home` para `/subjects`), a URL do browser muda (`window.history.pushState`) e a página anterior é totalmente desmontada e eliminada da memória.
No Mobile, a navegação funciona como um baralho de cartas (**Pilhas / Stacks**):
- Quando você navega de "Disciplinas" para "Editar Disciplina", a tela de edição é colocada *em cima* da tela de disciplinas.
- Ao clicar em "Voltar", a tela de cima é removida (*pop*) e a tela de disciplinas reaparece exatamente no mesmo ponto de rolagem e com o mesmo estado anterior.
- As 5 telas principais são gerenciadas pelo `@react-navigation/bottom-tabs`, que preserva o estado de cada aba sem recarregar tudo do zero.

#### Comparação de Código:

**No React Web (`MobileNav.tsx` com `react-router-dom`):**
```tsx
<NavLink to="/subjects">
  <BookOpen />
  <span>Disciplinas</span>
</NavLink>
```

**No React Native (`RootNavigator.tsx` com `@react-navigation`):**
```tsx
<Tab.Navigator>
  <Tab.Screen
    name="SubjectsTab"
    component={SubjectsScreen}
    options={{
      tabBarLabel: "Disciplinas",
      tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
    }}
  />
</Tab.Navigator>
```

---

### 6. Armazenamento Local: `localStorage` vs. `AsyncStorage`

#### O Conceito:
Na Web, o objeto `window.localStorage` grava dados em texto plano de forma síncrona. Isso significa que ele bloqueia a thread de execução do JavaScript até terminar de ler ou gravar.
No celular, não existe `window`. Usamos `@react-native-async-storage/async-storage`:
- Ele é **assíncrono** (utiliza `async / await` e `Promises`).
- Ele grava nativamente no banco SQLite ou no *SharedPreferences* do Android e no sistema de arquivos do iOS.
- Quando executado no navegador (`react-native-web`), ele mapeia transparentemente para o `localStorage` do browser sem quebrar seu código.

#### Comparação de Código:

**No React Web (`authService.ts`):**
```ts
// Síncrono e bloqueante
localStorage.setItem("studymate_current_user", JSON.stringify(usuario));
const usuario = JSON.parse(localStorage.getItem("studymate_current_user"));
```

**No React Native (`authService.ts`):**
```ts
// Assíncrono com Promises
await AsyncStorage.setItem("studymate_current_user", JSON.stringify(usuario));
const dados = await AsyncStorage.getItem("studymate_current_user");
const usuario = dados ? JSON.parse(dados) : null;
```

---

## Estrutura de Arquivos

```
studymate-app/mobile/
├── App.tsx                     # Ponto de entrada com Providers
├── app.json                    # Configurações do Expo (Web, Android, iOS)
├── assets/                     # Imagens estáticas (mascote, logos)
├── dist/                       # Bundle compilado para Web / Nginx
├── package.json                # Dependências e scripts
├── tsconfig.json               # Configurações TypeScript
└── src/
    ├── api/                    # Configurações de baseURL dinâmicas
    ├── components/             # Componentes visuais atômicos (Card, Button, Input, Header)
    ├── navigation/             # Pilhas (Stack) e Abas (Bottom Tabs)
    ├── screens/                # Telas completas da aplicação
    ├── services/               # Comunicação HTTP (fetch) e AsyncStorage
    └── types/                  # Tipagens compartilhadas TypeScript
```
