# Casos de Uso do Sistema

![Caso de Uso](/docs/use_case_diagram.svg.jpg)

## Ator: Estudante

1. **Cadastrar Usuário**
   - Informar nome, e-mail e senha para criação da conta.
   - Confirmar os dados necessários para acesso ao StudyMate.
   - Receber informação caso os dados fornecidos sejam inválidos.

2. **Realizar Login**
   - Informar e-mail e senha cadastrados.
   - Autenticar-se para acessar suas informações acadêmicas.
   - Receber informação caso as credenciais sejam inválidas.

3. **Gerenciar Perfil**
   - Visualizar os dados do perfil.
   - Editar informações como nome, curso, matrícula e instituição.

4. **Gerenciar Período Letivo**
   - Cadastrar períodos letivos.
   - Informar nome, data de início e data de término.
   - Visualizar períodos cadastrados.
   - Editar ou excluir períodos letivos.

5. **Gerenciar Disciplinas**
   - Cadastrar disciplinas vinculadas a um período letivo.
   - Informar nome da disciplina, professor, média de aprovação e limite de faltas.
   - Listar e pesquisar disciplinas.
   - Editar ou excluir disciplinas cadastradas.

6. **Gerenciar Horários de Aula**
   - Cadastrar horários vinculados às disciplinas.
   - Informar dia da semana, horário de início, horário de término e local da aula.
   - Visualizar os horários cadastrados.
   - Editar ou excluir horários de aula.

7. **Visualizar Agenda Acadêmica**
   - Visualizar, em um único local, horários de aula, tarefas e avaliações.
   - Acompanhar datas e prazos relacionados às atividades acadêmicas.
   - Identificar tarefas pendentes e avaliações próximas.

8. **Gerenciar Tarefas**
   - Cadastrar tarefas vinculadas às disciplinas.
   - Informar título, tipo, descrição, prazo e prioridade.
   - Visualizar tarefas pendentes e concluídas.
   - Editar ou reagendar tarefas.
   - Marcar tarefas como concluídas.
   - Reabrir tarefas concluídas.
   - Excluir tarefas.

9. **Gerenciar Avaliações**
   - Cadastrar avaliações vinculadas às disciplinas.
   - Informar nome, tipo, nota, peso e data da avaliação.
   - Visualizar as avaliações cadastradas.
   - Editar ou excluir avaliações.

10. **Calcular Média**
    - Calcular automaticamente a média da disciplina com base nas avaliações e seus respectivos pesos.
    - Atualizar a média quando avaliações ou notas forem cadastradas, alteradas ou excluídas.
    - Desconsiderar avaliações ainda sem nota no cálculo.
    - Exibir a média atual da disciplina.

11. **Registrar Presenças e Faltas**
    - Registrar presença em aula vinculada a uma disciplina e data.
    - Registrar faltas vinculadas a uma disciplina e data.
    - Informar a quantidade de aulas perdidas em um registro de falta.
    - Visualizar os registros de presenças e faltas.

12. **Acompanhar Frequência**
    - Visualizar o total de faltas acumuladas em cada disciplina.
    - Acompanhar o limite de faltas permitido.
    - Identificar quando a quantidade de faltas estiver próxima do limite definido.

13. **Consultar Notificações**
    - Receber notificações sobre tarefas com prazos próximos.
    - Receber avisos sobre avaliações futuras.
    - Receber alertas relacionados ao risco de reprovação por média ou faltas.
    - Visualizar notificações.
    - Marcar notificações como lidas.

14. **Acompanhar Progresso**
    - Acumular experiência (XP) ao realizar atividades acadêmicas elegíveis.
    - Receber XP pela conclusão de tarefas e pelo registro de presença, conforme as regras de gamificação.
    - Visualizar XP acumulado e nível atual.
    - Acompanhar a sequência de dias de atividade.
    - Visualizar a evolução do progresso no StudyMate.

15. **Acompanhar Conquistas**
    - Desbloquear conquistas ao cumprir critérios definidos pelo sistema.
    - Visualizar conquistas obtidas.
    - Visualizar medalhas ou badges associados às conquistas.
    - Consultar informações relacionadas às conquistas.
    - Registrar a data em que cada conquista foi desbloqueada.

16. **Consultar Tarefas Offline**
    - Consultar tarefas previamente armazenadas no dispositivo sem conexão com a internet.
    - Visualizar alterações locais ainda não sincronizadas.
    - Continuar acessando as tarefas contempladas pelo funcionamento offline.
    - Receber informação quando não houver dados locais disponíveis.

17. **Realizar Alterações em Tarefas Offline**
    - Cadastrar tarefas sem conexão com a internet.
    - Editar tarefas armazenadas localmente.
    - Concluir ou reabrir tarefas offline.
    - Excluir tarefas offline.
    - Manter as alterações armazenadas localmente até a sincronização com o servidor.

18. **Sincronizar Tarefas com o Servidor**
    - Enviar ao servidor as operações realizadas offline quando houver conexão.
    - Atualizar os dados locais com informações recebidas do servidor.
    - Evitar duplicidade de operações em caso de reenvio.
    - Manter operações pendentes quando ocorrer falha de sincronização.
    - Realizar nova tentativa de sincronização posteriormente.

19. **Consultar Estado da Sincronização**
    - Visualizar quando os dados estiverem sincronizados.
    - Identificar operações pendentes de sincronização.
    - Visualizar quando ocorrer uma falha durante o processo.
    - Acompanhar se as alterações locais já foram enviadas ao servidor.