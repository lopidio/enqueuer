# enqueuer
[![npm version](https://badge.fury.io/js/enqueuer.svg)](https://badge.fury.io/js/enqueuer) [![Build Status](https://travis-ci.org/lopidio/enqueuer.svg?branch=develop)](https://travis-ci.org/lopidio/enqueuer)

![enqueuerlogo](https://github.com/lopidio/enqueuer/blob/develop/docs/logo/fullLogo1.png "Enqueuer Logo")

# sumário
**Enqueuer** é uma ferramenta multiprotocolo de testes de sistemas assíncrono

## o que faz?
Verifica se um componente dirigido a eventos atua como esperado quando estimulado por um evento.
Por "atua como esperado" se quer dizer:
  - publica onde deve publicar;
  - publica o que deve publicar;
  - publica mais rápido que o tempo máximo.

Não resta dúvidas do quão importante os eventos são, logo, testar os sistemas orientados a eventos se torna uma tarefa de alta prioridade.
Ao se desenvolver um sistema desse tipo, se torna difícil de manter como cada componente troca mensagens com um outro.
O que **enqueuer** se propõe a fazer é assegurar que um componente, ou um conjunto de componentes de um mesmo fluxo, atua como deveria quando foi concebido.

## por que é útil?
Foi designado para ajudar o processo de desenvolvimento.
Embora haja outras maneiras de ser utilizado, as duas principais são:
  - enquanto desenvolvendo uma nova funcionalidade do componente de um jeito similar ao TDD; e
  - adicionando como uma etapa da pipeline de integração contínua, assegurando que o componente permanece funcionando apropriadamente a cada commit.

## como funciona?
1. recebe um [cenário de testes](/playground "Runnable exemplo");
2. inicia o teste publicando ou esperando algum evento;
3. espera o tempo máximo estabelecido ou que todos os eventos de saída esperados sejam recebidos;
4. executa testes em cima das mensagens trocadas;
5. reporta o [relatório final](/outputExamples/).
    
### permita-me desenhar para você
É assim que um componente dirigido a evento age quando estimulado por um *Input*:\
![2018-03-11 19_20_00](https://media.giphy.com/media/YWLDPktqvpBIBgzYEX/giphy.gif "Comportamento esperado de um componente dirigido a eventod")\
**enqueuer** dispara o evento esperado fazendo com que o componente a ser testado atue.
Logo, **enqueuer** coleta os *Outputs* e verifica se estão conforme descrito previamente.
Bem simples, não acha?

### como usar
    $ enqueuer --help
         Usage: enqueuer [options]
         Options:
           -V, --version             Exibe o número da versão
           -v, --verbose             Ativa o modo verboso
           -l, --log-level <level>   Altera o level do log
           -c, --config-file <path>  Altera o endereço do arquivo de configuração
           -h, --help                Exibe o próprio modo de uso

##### vá fundo e experimente:
    $ git clone https://github.com/lopidio/enqueuer.git
    $ cd enqueuer
    $ npm install
    $ npm run build
    $ enqueuer --config-file conf/enqueuer.yml --session-variables httpPayload=virgs

Sem grandes surpresas, hum? Tão simples quanto `$enqueuer`.

#### protocolos IPC atualmente suportados
1. **Amqp**   - Advanced Message Queuing Protocol
2. **File**
3. **Http**   - Hypertext Transfer Protocol
4. **Kafka**
5. **Mqtt**   - Message Queuing Telemetry Transport
6. **Sqs**    - Amazon Simple Queue Service
7. **StdOut** - Process Standard output
8. **Stomp**  - Simple (or Streaming) Text Orientated Messaging Protocol
9. **Uds**    - Unix Domain Sockets

### questão ~~nem tão~~ frequentemente perguntada
1.	**Questão**: Uma vez que **enqueuer** é uma ferramenta para testar componentes dirigidos a eventos e **enqueuer** é um componente dirigido a eventos, **enqueue** testa a si mesmo?\
	**Resposta**: Estou grato que tenha se perguntado isso. A resposta é sim, a ferramenta se testa, absolutamente, [dê uma olhada](/src/inceptionTest/inception.comp.ts "Inception Teste")

## cenário de testes
Um cenário de testes parece com [isso](/playground "Exemplos de teste") e com [isso](/integrationTest "Mais exemplos").
Abaixo, uma definição dos campos do cenário de teste:
#### **runnable**:
-	**runnableVersion**: string, informa qual versão deve ser executada. Atualmente, só a versão "01.00.00" é aceita.
-	**name**: string, identifica o **runnable** por toda a execução do cenário.
-	**initialDelay**: número opcional em milissegundos, informa quanto tempo o cenário tem que esperar antes de considerar o teste como expirado. Ex.: 2000.
-	**runnables**: vetor de outros **runnables** ou **requisitions**. Sim, a parada pode ficar recursiva.

#### **requisition**:
-	**timeout**: número opcional em milissegundos, informa quanto tempo o cenário tem que esperar antes de considerar o teste como expirado. Ex.: 2000.
-	**name**: string, identifica a requisição por toda a execução.
-	**startEvent**:\
    -	**publisher**: object
        -	**type**: string, identifica o protocolo a ser publicado. Ex.: "mqtt", "kafka", "amqp" etc..
        -	**name**: string, identifica o **publisher** por toda a execução.
        -	**payload**: string/object/number, o que será publicado. Pode ser o que for desejado. Inclusive outro **runnable**.[Saca essa](/src/inceptionTest/inceptionRequisition.json)
        -	**prePublishing**: código javascript, código executado imediatamente antes da publicação da mensagem. 
                    Existe uma variável especial chamada **publisher**. A variável representa o próprio **publisher** e seus atributos.
                    É possível inclusive redefinir novos valores para esses atributos em "tempo de execução".
                    Tipo assim: ```"publisher.payload=new Date().getTime();"``` or ```"publisher.type='mqtt'"```.
                    É possível fazer testes, caso desejado: Ex.: ```"test['typeMqtt'] = publisher.type=='mqtt';"```.
                    Leia mais sobre meta-functions na sessão **meta-function**.			
        -	**onMessageReceived**: código javascript, código executado quando o protocolo (geralmente síncrono) fornece algum dado quando uma mensagem é publicada. 
                    Existe uma variável especial chamada **message**. À variável será atribuída a informação vinda da publicação da mensagem. 
                    Como dito anteriormente, também é possível realizar testes nesse código.
                    Leia mais sobre meta-functions na sessão **meta-function**.			
-	**subscriptions**: vetor de subscriptions
    -	**subscription**, object
        -	**type**: string, identifica o protocolo a ser subscrito. Ex.: "mqtt", "kafka", "amqp" etc..
        -	**name**: string, identifica a **subscription** por toda a execução.
        -	**timeout**: número opcional em milissegundos, informa quanto tempo a subscrição deve esperar antes de ser considerada como inválida. Ex.: 2000.
        -	**onMessageReceived**: código javascript, executada quando o evento aguardado é recebido.
                Existe uma variável especial chamada **message**. À variável será atribuída a própria mensagem recebida.
                Como dito anteriormente, também é possível realizar testes nesse código.
                Leia mais sobre meta-functions na sessão **meta-function**.			

### quando um cenário de testes é inválido?
Um cenário de testes é inválido quando:
- Pelo menos um cenário de testes aninhado é inválido; ou
- Pelo menos uma requisição interna é inválida por:
    - Tempo expirado; or
    - Evento de início é inválido por: ou;
        - Não foi possível iniciar o teste; ou
        - Pelo menos um teste é inválido.
    - Pelo menos uma subscrição é inválida por:
        - Não foi possível se conectar; ou
        - Tempo máximo expirou; ou
        - Não recebeu mensagens; ou
        - Pelo menos um teste é inválido.

O valor '**valid**' na raiz do [relatório final](/outputExamples/) será **false**.

### meta-functions 
Ao escrever uma meta-function (*onMessageReceived, prePublishing*) haverá uma variável especial chamada **test**
-	**test**:
    Para testar algo: "test['nome do teste'] = expressãoBooleana;".
    A expressão booleana será avaliada em tempo de execução e todas as averiguações serão levadas em consideração para determinar se um cenário é válido ou não.
    Ex.: ```"test['test label'] = true;"```.
-	**special functions**:
Haverá também três funções especiais: **persistEnqueuerVariable(name, value)**, **persistSessionVariable(name, value)** e **deleteEnqueuerVariable(name)**;
Para recuperar uma variável *enqueuerVariable* ou uma variável *sessionVariable* use chaves duplas: "{{variableName}}". Ex.: ```console.log({{httpPort}});```
    -	**persistEnqueuerVariable**:
    *EnqueuerVariables* são persistidas no [arquivo de configuração](/conf/enqueuer.yml), portanto, elas são persistidas entre diferentes execuções de **enqueuer**.
    É possível persistir uma variável *enqueuerVariable* escrevendo um código assim: ```persistEnqueuerVariable("httpPort", 23076);```
    -	**deleteEnqueuerVariable**:
    Para deletar uma *enqueuerVariable* faça isso: ```deleteEnqueuerVariable("httpPort");```.
    -	**persistSessionVariable**:
    Por outro lado, *sessionVariables* são mantidas em memória, o que significa que seráo disponíveis apenas durante o processo **enqueuer** corrente.
    É possível persistir uma *sessionVariable*, escreva um código assim: ```persistSessionVariable("sessionVar", 100)```;

## arquivo de configuração
Por padrão, **enqueuer** procura um arquivo em [conf/enqueuer.yml](/conf/enqueuer.yml) para configurar suas opções de execução.
Abaixo, uma explicação de cada atributo do arquivo:

##### run-mode:
Explicita o modo de execução. Existem duas opções mutualmente exclusivas:
- *daemon* (padrão): **enqueuer** será executado indefinidamente. Interminavelmente. Como um serviço. Quando executando neste modo, **enqueuer** permanecerá esperando por novos cenários de testes pelos [protocolos definidos logo abaixo](/src/inceptionTest/beingTested.yml).

- *single-run*: este modo é o mais comumente usado quando o objetivo é complementar a pipeline de integração contínua. Todo arquivo cujo nome for reconhecido pelo padrão será reconhecido como um cenário de teste e em seguida executado.
Quando todos os cenários forem executados, **enqueuer** encerrará a execução, compilará um [relatório final](/outputExamples/singleRunOutput.json) e retornará um código de status de execução com os seguintes valores:
     - 0, if all runnables are valid; or
     - 1, if there is at least one invalid runnable.
    
##### outputs:

Aceita uma lista de mecanismos de publicações. Cada vez que um novo cenário de teste é executado, **enqueuer** publica pelo protocolo definido o resultado.

##### log-level:

Define a profundidade que os logs terão. Os valores aceitos são: **trace**; **debug**; **info**; **warning**; **error**; and **fatal**.

##### variables
Zona onde as variáveis persistidas entre diferentes execuções do enqueuer são armazenadas.