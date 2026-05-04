# Guía Firebase para Motos Mendes

Firebase é uma plataforma do Google que oferece ferramentas prontas para que seu aplicativo seja profissional, rápido e seguro, sem precisar de um servidor complexo.

## 1. O que já estamos usando?
<br/>
### **Firebase Hosting** (Hospedagem)
- **O que faz:** Coloca seu catálogo na internet (URL pública).
- **Vantagem:** É extremamente rápido em qualquer lugar e gratuito até certo limite de tráfego. Como é uma **PWA**, permite que seus clientes "instalem" o catálogo na tela inicial do celular como se fosse um app comum.

---

## 2. O que podemos aplicar no futuro? (Evolução)
<br/>
### **A. Firestore (Banco de Dados em Tempo Real)**
- **Como funciona:** Em vez de você precisar "Publicar" toda vez que muda um preço, os dados ficam em uma nuvem central.
- **Vantagem:** Se você mudar o preço de uma peça no Excel, o aplicativo de todos os seus clientes (Android, iPhone e Web) se atualiza **em segundos**, sem que eles precisem fechar ou recarregar nada.

### **B. Authentication (Controle de Clientes)**
- **Como funciona:** Cria um sistema de Login (E-mail/Senha ou Telefone).
- **Vantagem:** Você pode decidir quem vê o quê. Exemplo: Vendedores veem o estoque real, mas clientes finais veem apenas "Em Estoque". Ou criar preços diferentes para clientes diferentes.

### **C. Cloud Messaging (Notificações)**
- **Como funciona:** Envia alertas para o celular dos usuários.
- **Vantagem:** "Avisar todos que o novo contêiner de peças KM PRO chegou!". Isso aumenta muito as vendas.

### **D. Analytics (Relatórios)**
- **Como funciona:** Monitora o que as pessoas fazem no app.
- **Vantagem:** Você saberá quais marcas são as mais buscadas (ex: Saber se as pessoas buscam mais PRO TORK ou KM PRO) para planejar melhor seu estoque.

---

## 3. Limites do Plano Gratuito (Spark Plan)

O Firebase é grátis até atingir estes limites mensais:

-   **Armazenamento (Hosting):** 1 GB (Seu projeto hoje usa ~180 MB, está super seguro).
-   **Transferência de Dados (Bandwidth):** 10 GB por mês (Aproximadamente 360 MB por dia).
    -   *Dica:* Como o catálogo é uma PWA, as imagens ficam salvas no celular do cliente após a primeira visita, o que economiza muita transferência!

**Onde acompanhar os limites?**
Você pode ver os gráficos de uso em tempo real aqui:
[Console Firebase - Uso de Hosting](https://console.firebase.google.com/project/catalogo-motos-mendes/hosting/usage)

---

## 4. Planos: Spark vs Blaze

### **Plano Spark (O que você tem agora)**
-   **Custo:** Sempre R$ 0,00.
-   **Se passar do limite:** O site apenas para de funcionar até o dia/mês seguinte. **O Google não te cobra nada.** É o plano mais "seguro" contra surpresas.

### **Plano Blaze (Pay-as-you-go)**
-   **Custo:** Você paga apenas o que usar **acima** do limite gratuito. Não tem mensalidade fixa. 
-   **Exemplo:** Se o limite é 10GB e você usou 11GB, você paga apenas pelos 1GB extras (centavos de dólar).
-   **Vantagem:** O site nunca sai do ar.
-   **Controle:** Você pode colocar um "Aviso de Gasto" para receber um e-mail se a conta chegar em 5 ou 10 dólares, por exemplo.

---

## 5. Preguntas Frecuentes (FAQ)

### **A "Creação de Catálogo" (PDF) consome meus limites?**
**Não.** O PDF é gerado inteiramente no dispositivo do seu cliente (no navegador ou no iPhone). 
-   **Armazenamento:** Não usa nada do Firebase, pois o arquivo não fica salvo no servidor, ele vai direto para o download do cliente.
-   **Transferência (Bandwidth):** Quase nada. O app só baixa as imagens necessárias uma vez. Se o cliente já estiver navegando e as fotos já apareceram na tela, ele não gasta dados extras para gerar o PDF.

---

## Próximo Passo Sugerido
No momento, o sistema de **Hosting** + **Publicação Manual** (Excel -> Build -> Deploy) é o mais simples e custo zero. 

Si as fotos e preços começarem a mudar **muitas vezes por dia**, recomendo passarmos para o **Firestore** para que a sincronização seja 100% automática.
